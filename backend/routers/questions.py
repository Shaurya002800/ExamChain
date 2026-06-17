from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import List, Optional
import hashlib, json

from utils.database import get_db
from utils.auth import get_current_user
from utils.crypto import encrypt_question, get_merkle_proof
from utils.key_management import fingerprint_key, generate_exam_key, seal_exam_key
from models.db_models import Question, Exam, ExamKey

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
    points: float = 1.0

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
    if exam.tenant_id != user.get("tenant_id", "default"):
        raise HTTPException(status_code=403, detail="Exam belongs to a different tenant")

    # Generate or use a provided pilot key, then escrow it server-side.
    if data.aes_key_hex:
        aes_key = bytes.fromhex(data.aes_key_hex)
    else:
        aes_key = generate_exam_key()
    key_fingerprint = fingerprint_key(aes_key)

    key_result = await db.execute(select(ExamKey).where(ExamKey.exam_id == data.exam_id))
    key_record = key_result.scalar_one_or_none()
    if not key_record:
        key_record = ExamKey(
            exam_id=data.exam_id,
            tenant_id=exam.tenant_id or user.get("tenant_id", "default"),
            encrypted_key=seal_exam_key(aes_key),
            key_fingerprint=key_fingerprint,
        )
        db.add(key_record)
    else:
        key_record.encrypted_key = seal_exam_key(aes_key)
        key_record.key_fingerprint = key_fingerprint
        key_record.status = "ACTIVE"

    uploaded = []
    for q in data.questions:
        correct = q.correct.strip().upper()
        if correct not in {"A", "B", "C", "D"}:
            raise HTTPException(status_code=400, detail="Correct answer must be A, B, C, or D")

        plaintext = {
            "text":     q.text,
            "option_a": q.option_a,
            "option_b": q.option_b,
            "option_c": q.option_c,
            "option_d": q.option_d,
            "correct":  correct,
        }
        public_payload = {
            "text": q.text,
            "options": {
                "A": q.option_a,
                "B": q.option_b,
                "C": q.option_c,
                "D": q.option_d,
            },
        }
        # Encrypt question
        encrypted = encrypt_question(plaintext, aes_key)
        encrypted_str = json.dumps(encrypted)

        # Hash of plaintext (for Merkle tree)
        q_hash = "0x" + hashlib.sha256(
            json.dumps(plaintext, sort_keys=True).encode()
        ).hexdigest()
        correct_hash = "0x" + hashlib.sha256(f"{q_hash}:{correct}".encode()).hexdigest()

        question = Question(
            exam_id        = data.exam_id,
            encrypted_data = encrypted_str,
            public_payload = public_payload,
            question_hash  = q_hash,
            correct_answer_hash = correct_hash,
            merkle_leaf    = q_hash,
            points         = q.points,
            difficulty     = q.difficulty,
            discrimination = 1.0,
            guessing       = 0.25,
            subject_area   = q.subject_area or ""
        )
        db.add(question)
        uploaded.append({"question_hash": q_hash, "correct_answer_hash": correct_hash})

    await db.commit()

    return {
        "success":        True,
        "uploaded":       len(uploaded),
        "key_fingerprint":key_fingerprint,
        "key_escrowed":   True,
        "questions":      uploaded,
        "message":        "Questions encrypted and stored. The exam key is escrowed server-side; keep the fingerprint for audit."
    }


@router.get("/{exam_id}/list")
async def list_questions(
    exam_id: str,
    db:      AsyncSession = Depends(get_db),
    user:    dict         = Depends(get_current_user)
):
    """Returns question metadata only (no encrypted data exposed)."""
    result = await db.execute(
        select(Question).join(Exam).where(
            Question.exam_id == exam_id,
            Exam.tenant_id == user.get("tenant_id", "default"),
        )
    )
    questions = result.scalars().all()
    return [
        {
            "id":           q.id,
            "difficulty":   q.difficulty,
            "subject_area": q.subject_area,
            "question_hash":q.question_hash,
            "points":       q.points,
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
