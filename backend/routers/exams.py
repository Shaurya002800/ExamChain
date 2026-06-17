from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
import hashlib

from utils.database import get_db
from utils.auth import get_current_user
from utils.crypto import build_merkle_tree
from utils.blockchain import get_web3, get_question_vault
from models.db_models import Exam, Examiner
from config import get_settings

router = APIRouter()
settings = get_settings()


# ── Schemas ────────────────────────────────────────────────────

class CreateExamRequest(BaseModel):
    title:         str
    subject:       str
    start_time:    datetime
    end_time:      datetime
    duration_mins: int
    total_marks:   int = 100


# ── Routes ─────────────────────────────────────────────────────

@router.post("/create")
async def create_exam(
    data: CreateExamRequest,
    db:   AsyncSession = Depends(get_db),
    user: dict         = Depends(get_current_user)
):
    if user.get("role") != "examiner":
        raise HTTPException(status_code=403, detail="Only examiners can create exams")

    # Verify examiner exists
    result = await db.execute(select(Examiner).where(Examiner.id == user["sub"]))
    examiner = result.scalar_one_or_none()
    if not examiner:
        raise HTTPException(status_code=404, detail="Examiner not found")

    # Generate exam ID hash for blockchain (bytes32)
    import uuid
    exam_id = str(uuid.uuid4())
    exam_id_hash = "0x" + hashlib.sha256(exam_id.encode()).hexdigest()

    exam = Exam(
        id            = exam_id,
        tenant_id     = examiner.tenant_id or user.get("tenant_id", "default"),
        title         = data.title,
        subject       = data.subject,
        creator_id    = user["sub"],
        start_time    = data.start_time,
        end_time      = data.end_time,
        duration_mins = data.duration_mins,
        total_marks   = data.total_marks,
        exam_id_hash  = exam_id_hash,
        status        = "DRAFT"
    )
    db.add(exam)
    await db.commit()
    await db.refresh(exam)

    return {
        "exam_id":      exam.id,
        "exam_id_hash": exam_id_hash,
        "title":        exam.title,
        "status":       exam.status,
        "start_time":   exam.start_time.isoformat(),
        "end_time":     exam.end_time.isoformat(),
    }


@router.get("/list")
async def list_exams(
    db:   AsyncSession = Depends(get_db),
    user: dict         = Depends(get_current_user)
):
    if user.get("role") == "examiner":
        result = await db.execute(
            select(Exam).where(
                Exam.creator_id == user["sub"],
                Exam.tenant_id == user.get("tenant_id", "default")
            )
        )
    else:
        result = await db.execute(
            select(Exam).where(
                Exam.status.in_(["LOCKED", "ACTIVE"]),
                Exam.tenant_id == user.get("tenant_id", "default")
            )
        )
    exams = result.scalars().all()
    return [
        {
            "exam_id":      e.id,
            "title":        e.title,
            "subject":      e.subject,
            "status":       e.status,
            "start_time":   e.start_time.isoformat(),
            "end_time":     e.end_time.isoformat(),
            "total_marks":  e.total_marks,
            "duration_mins":e.duration_mins,
            "is_released":  e.is_released,
            "merkle_root":  e.merkle_root,
            "vault_tx_hash":e.vault_tx_hash,
            "ledger_mode":  e.ledger_mode,
            "tenant_id":    e.tenant_id,
        }
        for e in exams
    ]


@router.get("/{exam_id}")
async def get_exam(
    exam_id: str,
    db:      AsyncSession = Depends(get_db),
    user:    dict         = Depends(get_current_user)
):
    result = await db.execute(select(Exam).where(Exam.id == exam_id))
    exam = result.scalar_one_or_none()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    if user.get("role") == "student" and exam.tenant_id != user.get("tenant_id", "default"):
        raise HTTPException(status_code=403, detail="Exam belongs to a different tenant")
    if user.get("role") == "examiner" and exam.creator_id != user["sub"]:
        raise HTTPException(status_code=403, detail="Not your exam")
    return {
        "exam_id":      exam.id,
        "title":        exam.title,
        "subject":      exam.subject,
        "status":       exam.status,
        "start_time":   exam.start_time.isoformat(),
        "end_time":     exam.end_time.isoformat(),
        "duration_mins":exam.duration_mins,
        "total_marks":  exam.total_marks,
        "merkle_root":  exam.merkle_root,
        "is_released":  exam.is_released,
        "vault_tx_hash":exam.vault_tx_hash,
        "ledger_mode":  exam.ledger_mode,
        "tenant_id":    exam.tenant_id,
    }


@router.post("/{exam_id}/lock")
async def lock_exam_to_blockchain(
    exam_id: str,
    db:      AsyncSession = Depends(get_db),
    user:    dict         = Depends(get_current_user)
):
    """
    Lock the exam to blockchain.
    Builds Merkle tree from all questions and calls QuestionVault.createExam()
    """
    if user.get("role") != "examiner":
        raise HTTPException(status_code=403, detail="Only examiners can lock exams")

    result = await db.execute(select(Exam).where(Exam.id == exam_id))
    exam = result.scalar_one_or_none()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    if exam.creator_id != user["sub"]:
        raise HTTPException(status_code=403, detail="Not your exam")

    # Get all questions for this exam
    from models.db_models import Question
    from sqlalchemy import select as sa_select
    q_result = await db.execute(
        sa_select(Question).where(Question.exam_id == exam_id)
    )
    questions = q_result.scalars().all()
    if not questions:
        raise HTTPException(status_code=400, detail="No questions found. Add questions first.")

    # Build Merkle tree from question hashes
    leaves = [bytes.fromhex(q.question_hash.replace("0x", "")) for q in questions]
    merkle_root, _ = build_merkle_tree(leaves)

    # Get encrypted CIDs (using question IDs as storage references)
    encrypted_cids = [q.id for q in questions]

    # Call smart contract
    try:
        w3       = get_web3()
        vault    = get_question_vault()
        account  = w3.eth.accounts[0]
        exam_bytes   = bytes.fromhex(exam.exam_id_hash.replace("0x", ""))
        merkle_bytes = bytes.fromhex(merkle_root.replace("0x", ""))

        start_ts = int(exam.start_time.timestamp())
        end_ts   = int(exam.end_time.timestamp())

        fn = vault.functions.createExam(
            exam_bytes, merkle_bytes, start_ts, end_ts, encrypted_cids
        )
        tx_hash = fn.transact({"from": account})
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash)

        # Update exam in DB
        exam.merkle_root   = merkle_root
        exam.vault_tx_hash = receipt.transactionHash.hex()
        exam.ledger_mode   = "BLOCKCHAIN"
        exam.ledger_error  = None
        exam.status        = "LOCKED"
        exam.is_released   = True
        await db.commit()

        return {
            "success":     True,
            "merkle_root": merkle_root,
            "tx_hash":     receipt.transactionHash.hex(),
            "status":      "LOCKED",
            "message":     f"Exam locked to blockchain with {len(questions)} questions"
        }
    except Exception as e:
        local_tx = "0x" + hashlib.sha256(
            f"{exam.id}:{merkle_root}:{len(questions)}:{datetime.utcnow().isoformat()}".encode()
        ).hexdigest()
        exam.merkle_root   = merkle_root
        exam.vault_tx_hash = local_tx
        exam.ledger_mode   = "LOCAL_LEDGER"
        exam.ledger_error  = str(e)
        exam.status        = "LOCKED"
        exam.is_released   = True
        await db.commit()

        return {
            "success":     True,
            "merkle_root": merkle_root,
            "tx_hash":     local_tx,
            "status":      "LOCKED",
            "ledger_mode": "LOCAL_LEDGER",
            "message":     f"Exam locked with local tamper-evident ledger fallback. Blockchain unavailable: {str(e)}"
        }
