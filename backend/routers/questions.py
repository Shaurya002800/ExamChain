from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import List, Optional
import hashlib, json

from utils.database import get_db
from utils.auth import get_current_user
from utils.crypto import encrypt_question, generate_aes_key, build_merkle_tree, get_merkle_proof
from models.db_models import Question, Exam

router = APIRouter()


# ── Schemas ────────────────────────────────────────────────────

class QuestionData(BaseModel):
    text:        str
    option_a:    str
    option_b:    str
    option_c:    str
    option_d:    str
    correct:     str          # "A", "B", "C", or "D"
    difficulty:  float = 0.5  # 0=easy, 1=hard
    subject_area: Optional[str] = ""

class BulkUploadRequest(BaseModel):
    exam_id:    str
    questions:  List[QuestionData]
    aes_key_hex: Optional[str] = None   # If not provided, a new key is generated


# ── Routes ─────────────────────────────────────────────────────

@router.post("/upload")
async def upload_questions(
    data: BulkUploadRequest,
    db:   AsyncSession = Depends(get_db),
    user: dict         = Depends(get_current_user)
):
    if user.get("role") != "examiner":
        raise HTTPException(status_code=403, detail="Only examiners can upload questions")

    # Verify exam exists and belongs to this examiner
    result = await db.execute(select(Exam).where(Exam.id == data.exam_id))
    exam = result.scalar_one_or_none()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    if exam.creator_id != user["sub"]:
        raise HTTPException(status_code=403, detail="Not your exam")

    # Generate or use provided AES key
    if data.aes_key_hex:
        aes_key = bytes.fromhex(data.aes_key_hex)
    else:
        aes_key = generate_aes_key()

    uploaded = []
    for q in data.questions:
        plaintext = {
            "text":     q.text,
            "option_a": q.option_a,
            "option_b": q.option_b,
            "option_c": q.option_c,
            "option_d": q.option_d,
            "correct":  q.correct,
        }
        # Encrypt question
        encrypted = encrypt_question(plaintext, aes_key)
        encrypted_str = json.dumps(encrypted)

        # Hash of plaintext (for Merkle tree)
        q_hash = "0x" + hashlib.sha256(
            json.dumps(plaintext, sort_keys=True).encode()
        ).hexdigest()

        question = Question(
            exam_id        = data.exam_id,
            encrypted_data = encrypted_str,
            question_hash  = q_hash,
            merkle_leaf    = q_hash,
            difficulty     = q.difficulty,
            discrimination = 1.0,
            guessing       = 0.25,
            subject_area   = q.subject_area or ""
        )
        db.add(question)
        uploaded.append({"question_hash": q_hash})

    await db.commit()

    # Return AES key hex so examiner can store it securely
    return {
        "success":        True,
        "uploaded":       len(uploaded),
        "aes_key_hex":    aes_key.hex(),
        "questions":      uploaded,
        "message":        "Questions encrypted and stored. Save the aes_key_hex securely — you need it to decrypt."
    }


@router.get("/{exam_id}/list")
async def list_questions(
    exam_id: str,
    db:      AsyncSession = Depends(get_db),
    user:    dict         = Depends(get_current_user)
):
    """Returns question metadata only (no encrypted data exposed)."""
    result = await db.execute(
        select(Question).where(Question.exam_id == exam_id)
    )
    questions = result.scalars().all()
    return [
        {
            "id":           q.id,
            "difficulty":   q.difficulty,
            "subject_area": q.subject_area,
            "question_hash":q.question_hash,
        }
        for q in questions
    ]


@router.get("/{exam_id}/merkle-proof/{question_id}")
async def get_question_merkle_proof(
    exam_id:     str,
    question_id: str,
    db:          AsyncSession = Depends(get_db),
    user:        dict         = Depends(get_current_user)
):
    """Get Merkle proof for a specific question."""
    result = await db.execute(
        select(Question).where(Question.exam_id == exam_id)
    )
    questions = result.scalars().all()
    ids = [q.id for q in questions]

    if question_id not in ids:
        raise HTTPException(status_code=404, detail="Question not found")

    index  = ids.index(question_id)
    leaves = [bytes.fromhex(q.question_hash.replace("0x", "")) for q in questions]
    proof  = get_merkle_proof(leaves, index)

    return {
        "question_id":  question_id,
        "index":        index,
        "merkle_proof": proof,
        "total":        len(questions)
    }