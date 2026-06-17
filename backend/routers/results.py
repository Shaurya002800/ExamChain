from datetime import datetime, timezone
import hashlib
import json
import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.db_models import Exam, ExamSession, Question, Result, Student
from utils.auth import get_current_user
from utils.database import get_db

router = APIRouter()


class CertifyRequest(BaseModel):
    session_id: str
    aes_key_hex: str | None = None


class ReviewRequest(BaseModel):
    decision: str
    note: str = ""


def _answer_hash(question_hash: str, answer: str) -> str:
    return "0x" + hashlib.sha256(f"{question_hash}:{answer.strip().upper()}".encode()).hexdigest()


def _public_verify_url(student_did: str, exam_id: str, vc_hash: str) -> str:
    return f"http://localhost:5173/verify?did={student_did}&exam={exam_id}&hash={vc_hash}"


def _tenant_id(user: dict) -> str:
    return user.get("tenant_id") or "default"


async def _load_session_context(session_id: str, db: AsyncSession) -> tuple[ExamSession, Exam, Student]:
    result = await db.execute(select(ExamSession).where(ExamSession.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    e_result = await db.execute(select(Exam).where(Exam.id == session.exam_id))
    exam = e_result.scalar_one_or_none()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    s_result = await db.execute(select(Student).where(Student.id == session.student_id))
    student = s_result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    return session, exam, student


async def _certify_from_hashed_answers(
    session: ExamSession,
    exam: Exam,
    student: Student,
    db: AsyncSession,
    reviewed_by: str | None = None,
    review_note: str = "",
) -> dict:
    if session.status != "COMPLETED":
        raise HTTPException(status_code=400, detail="Session must be completed before certification")

    q_result = await db.execute(select(Question).where(Question.exam_id == session.exam_id))
    questions = q_result.scalars().all()
    total_points = sum(float(q.points or 1.0) for q in questions) or len(questions) or 1
    answer_map = {a.get("q_id"): a for a in (session.answers or [])}
    raw_score = 0.0

    for question in questions:
        answer = answer_map.get(question.id, {}).get("answer", "")
        if answer and question.correct_answer_hash == _answer_hash(question.question_hash, answer):
            raw_score += float(question.points or 1.0)

    score = round((raw_score / total_points) * exam.total_marks, 2)
    percentage = round((score / max(exam.total_marks, 1)) * 100, 2)
    now = datetime.now(timezone.utc).isoformat()

    credential_subject = {
        "id": student.did,
        "name": student.name,
        "examId": exam.id,
        "examTitle": exam.title,
        "tenantId": exam.tenant_id,
        "score": score,
        "totalMarks": exam.total_marks,
        "percentage": percentage,
        "status": "FLAGGED" if session.is_flagged else "VERIFIED",
        "merkleRoot": exam.merkle_root,
        "ledgerMode": exam.ledger_mode,
    }
    vc = {
        "@context": ["https://www.w3.org/2018/credentials/v1"],
        "id": f"urn:uuid:{uuid.uuid4()}",
        "type": ["VerifiableCredential", "ExamResultCredential"],
        "issuer": {"id": "did:examchain:issuer", "name": "ExamChain"},
        "issuanceDate": now,
        "credentialSubject": credential_subject,
    }
    vc_json = json.dumps(vc, sort_keys=True, separators=(",", ":"))
    vc_hash = "0x" + hashlib.sha256(vc_json.encode()).hexdigest()

    local_tx = "0x" + hashlib.sha256(
        f"{session.id}:{student.did}:{exam.id}:{vc_hash}:{score}:{session.is_flagged}".encode()
    ).hexdigest()
    tx_hash = local_tx

    try:
        from utils.blockchain import get_web3, get_result_certifier
        w3 = get_web3()
        certifier = get_result_certifier()
        account = w3.eth.accounts[0]
        exam_bytes = bytes.fromhex(hashlib.sha256(exam.id.encode()).hexdigest())
        did_bytes = bytes.fromhex(hashlib.sha256(student.did.encode()).hexdigest())
        vc_bytes = bytes.fromhex(vc_hash.replace("0x", ""))
        fn = certifier.functions.certifyResult(
            exam_bytes, did_bytes, int(round(score)), exam.total_marks,
            vc_bytes, session.is_flagged
        )
        tx = fn.transact({"from": account})
        receipt = w3.eth.wait_for_transaction_receipt(tx)
        tx_hash = receipt.transactionHash.hex()
    except Exception:
        tx_hash = local_tx

    existing_result = await db.execute(
        select(Result).where(Result.student_id == student.id, Result.exam_id == exam.id)
    )
    db_result = existing_result.scalar_one_or_none()
    if not db_result:
        db_result = Result(student_id=student.id, exam_id=exam.id)
        db.add(db_result)

    db_result.score = score
    db_result.total_marks = exam.total_marks
    db_result.percentage = percentage
    db_result.is_flagged = session.is_flagged
    db_result.status = "CERTIFIED"
    db_result.reviewed_by = reviewed_by
    db_result.review_note = review_note
    db_result.vc_json = vc_json
    db_result.vc_hash = vc_hash
    db_result.chain_tx_hash = tx_hash
    db_result.certified_at = datetime.utcnow()
    await db.commit()

    return {
        "session_id": session.id,
        "student_name": student.name,
        "student_did": student.did,
        "exam_id": exam.id,
        "exam_title": exam.title,
        "score": score,
        "total_marks": exam.total_marks,
        "percentage": percentage,
        "is_flagged": session.is_flagged,
        "status": "CERTIFIED",
        "vc_hash": vc_hash,
        "chain_tx": tx_hash,
        "qr_data": _public_verify_url(student.did, exam.id, vc_hash),
        "vc": vc,
        "ledger_mode": "BLOCKCHAIN" if tx_hash != local_tx else "LOCAL_LEDGER",
    }


@router.get("/pending/{exam_id}")
async def get_pending_results(
    exam_id: str,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    if user.get("role") != "examiner":
        raise HTTPException(status_code=403, detail="Only examiners can review results")

    e_result = await db.execute(select(Exam).where(Exam.id == exam_id))
    exam = e_result.scalar_one_or_none()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    if exam.creator_id != user["sub"] or exam.tenant_id != _tenant_id(user):
        raise HTTPException(status_code=403, detail="Not your exam")

    session_result = await db.execute(
        select(ExamSession, Student, Result)
        .join(Student, Student.id == ExamSession.student_id)
        .outerjoin(Result, (Result.student_id == ExamSession.student_id) & (Result.exam_id == ExamSession.exam_id))
        .where(ExamSession.exam_id == exam_id, ExamSession.status == "COMPLETED")
    )

    rows = session_result.all()
    return [
        {
            "session_id": session.id,
            "student_id": student.id,
            "student_name": student.name,
            "student_did": student.did,
            "answers_count": len(session.answers or []),
            "integrity_score": session.integrity_score,
            "environment_score": session.environment_score,
            "behavior_score": session.behavior_score,
            "is_flagged": session.is_flagged,
            "flag_reason": session.flag_reason,
            "status": result.status if result else "PENDING",
            "score": result.score if result else None,
            "percentage": result.percentage if result else None,
            "vc_hash": result.vc_hash if result else None,
            "chain_tx": result.chain_tx_hash if result else None,
        }
        for session, student, result in rows
    ]


@router.post("/review/{session_id}")
async def review_result(
    session_id: str,
    data: ReviewRequest,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    if user.get("role") != "examiner":
        raise HTTPException(status_code=403, detail="Only examiners can review results")

    session, exam, student = await _load_session_context(session_id, db)
    if exam.creator_id != user["sub"] or exam.tenant_id != _tenant_id(user):
        raise HTTPException(status_code=403, detail="Not your exam")

    decision = data.decision.strip().upper()
    if decision == "CERTIFY":
        return await _certify_from_hashed_answers(
            session=session,
            exam=exam,
            student=student,
            db=db,
            reviewed_by=user["sub"],
            review_note=data.note,
        )
    if decision == "HOLD":
        existing_result = await db.execute(
            select(Result).where(Result.student_id == student.id, Result.exam_id == exam.id)
        )
        db_result = existing_result.scalar_one_or_none()
        if not db_result:
            db_result = Result(student_id=student.id, exam_id=exam.id)
            db.add(db_result)
        db_result.status = "HELD"
        db_result.reviewed_by = user["sub"]
        db_result.review_note = data.note
        db_result.is_flagged = True
        await db.commit()
        return {"session_id": session.id, "status": "HELD", "message": "Result held for manual investigation"}

    raise HTTPException(status_code=400, detail="Decision must be CERTIFY or HOLD")


@router.post("/certify")
async def certify_result(
    data: CertifyRequest,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    session, exam, student = await _load_session_context(data.session_id, db)
    if user.get("role") != "examiner":
        raise HTTPException(status_code=403, detail="Only examiners can certify results")
    if exam.creator_id != user["sub"] or exam.tenant_id != _tenant_id(user):
        raise HTTPException(status_code=403, detail="Not your exam")
    return await _certify_from_hashed_answers(session, exam, student, db, reviewed_by=user["sub"])


@router.get("/student/{student_id}")
async def get_student_results(
    student_id: str,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    if user.get("role") == "student" and student_id != user["sub"]:
        raise HTTPException(status_code=403, detail="Not your result")

    result = await db.execute(
        select(Result, Exam, Student)
        .join(Exam, Exam.id == Result.exam_id)
        .join(Student, Student.id == Result.student_id)
        .where(
            Result.student_id == student_id,
            Exam.tenant_id == _tenant_id(user),
        )
    )
    rows = result.all()
    return [
        {
            "exam_id": r.exam_id,
            "exam_title": exam.title,
            "student_name": student.name,
            "student_did": student.did,
            "score": r.score,
            "total": r.total_marks,
            "total_marks": r.total_marks,
            "percentage": r.percentage,
            "is_flagged": r.is_flagged,
            "status": r.status,
            "review_note": r.review_note,
            "vc_hash": r.vc_hash,
            "chain_tx": r.chain_tx_hash,
            "qr_data": _public_verify_url(student.did, exam.id, r.vc_hash) if r.vc_hash else None,
            "certified_at": r.certified_at.isoformat() if r.certified_at else None,
        }
        for r, exam, student in rows
    ]


@router.get("/verify")
async def verify_credential(
    did: str,
    exam_id: str,
    hash: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Result).where(Result.exam_id == exam_id, Result.vc_hash == hash)
    )
    r = result.scalar_one_or_none()
    if not r or r.status != "CERTIFIED":
        return {"verified": False, "message": "Credential not found or not certified"}

    try:
        from utils.blockchain import get_result_certifier
        certifier = get_result_certifier()
        exam_bytes = bytes.fromhex(hashlib.sha256(exam_id.encode()).hexdigest())
        did_bytes = bytes.fromhex(hashlib.sha256(did.encode()).hexdigest())
        vc_bytes = bytes.fromhex(hash.replace("0x", ""))
        on_chain = certifier.functions.verifyCredential(exam_bytes, did_bytes, vc_bytes).call()
    except Exception:
        on_chain = False

    return {
        "verified": on_chain or bool(r.chain_tx_hash),
        "student_did": did,
        "exam_id": exam_id,
        "score": r.score,
        "total_marks": r.total_marks,
        "percentage": r.percentage,
        "is_flagged": r.is_flagged,
        "status": r.status,
        "certified_at": r.certified_at.isoformat() if r.certified_at else None,
        "chain_tx": r.chain_tx_hash,
        "vc_hash": r.vc_hash,
    }
