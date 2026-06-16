from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
import json, hashlib

from utils.database import get_db
from utils.auth import get_current_user
from models.db_models import Result, ExamSession, Exam, Student, Question

router = APIRouter()


# ── Schemas ────────────────────────────────────────────────────

class CertifyRequest(BaseModel):
    session_id:  str
    aes_key_hex: str    # Examiner provides key to decrypt answer key


class CertifyLiveRequest(BaseModel):
    session_id: str


def _answer_hash(question_hash: str, answer: str) -> str:
    return "0x" + hashlib.sha256(f"{question_hash}:{answer.strip().upper()}".encode()).hexdigest()


def _public_verify_url(student_did: str, exam_id: str, vc_hash: str) -> str:
    return f"http://localhost:5173/verify?did={student_did}&exam={exam_id}&hash={vc_hash}"


async def _certify_from_hashed_answers(session: ExamSession, db: AsyncSession) -> dict:
    e_result = await db.execute(select(Exam).where(Exam.id == session.exam_id))
    exam = e_result.scalar_one_or_none()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    s_result = await db.execute(select(Student).where(Student.id == session.student_id))
    student = s_result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    q_result = await db.execute(select(Question).where(Question.exam_id == session.exam_id))
    questions = q_result.scalars().all()
    question_map = {q.id: q for q in questions}
    total_points = sum(float(q.points or 1.0) for q in questions) or len(questions) or 1
    answer_map = {a.get("q_id"): a for a in (session.answers or [])}
    raw_score = 0.0

    for question in questions:
        answer = answer_map.get(question.id, {}).get("answer", "")
        if answer and question.correct_answer_hash == _answer_hash(question.question_hash, answer):
            raw_score += float(question.points or 1.0)

    score = round((raw_score / total_points) * exam.total_marks, 2)
    percentage = round((score / max(exam.total_marks, 1)) * 100, 2)

    import uuid
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc).isoformat()
    canonical_subject = {
        "id": student.did,
        "name": student.name,
        "examId": exam.id,
        "examTitle": exam.title,
        "score": score,
        "totalMarks": exam.total_marks,
        "percentage": percentage,
        "status": "FLAGGED" if session.is_flagged else "VERIFIED",
        "merkleRoot": exam.merkle_root,
    }
    vc = {
        "@context": ["https://www.w3.org/2018/credentials/v1"],
        "id": f"urn:uuid:{uuid.uuid4()}",
        "type": ["VerifiableCredential", "ExamResultCredential"],
        "issuer": {"id": "did:examchain:issuer", "name": "ExamChain"},
        "issuanceDate": now,
        "credentialSubject": canonical_subject,
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
        select(Result).where(Result.student_id == session.student_id, Result.exam_id == session.exam_id)
    )
    db_result = existing_result.scalar_one_or_none()
    if not db_result:
        db_result = Result(student_id=session.student_id, exam_id=session.exam_id)
        db.add(db_result)

    db_result.score = score
    db_result.total_marks = exam.total_marks
    db_result.percentage = percentage
    db_result.is_flagged = session.is_flagged
    db_result.vc_json = vc_json
    db_result.vc_hash = vc_hash
    db_result.chain_tx_hash = tx_hash
    await db.commit()

    return {
        "session_id": session.id,
        "student_name": student.name,
        "student_did": student.did,
        "exam_title": exam.title,
        "score": score,
        "total_marks": exam.total_marks,
        "percentage": percentage,
        "is_flagged": session.is_flagged,
        "vc_hash": vc_hash,
        "chain_tx": tx_hash,
        "qr_data": _public_verify_url(student.did, exam.id, vc_hash),
        "vc": vc,
        "ledger_mode": "BLOCKCHAIN" if tx_hash != local_tx else "LOCAL_LEDGER",
    }


# ── Certify Result ─────────────────────────────────────────────

@router.post("/certify")
async def certify_result(
    data: CertifyRequest,
    db:   AsyncSession = Depends(get_db),
    user: dict         = Depends(get_current_user)
):
    if user.get("role") != "examiner":
        raise HTTPException(status_code=403, detail="Only examiners can certify results")

    # Get session
    result = await db.execute(
        select(ExamSession).where(ExamSession.id == data.session_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.status != "COMPLETED":
        raise HTTPException(status_code=400, detail="Session not completed yet")

    # Get exam
    e_result = await db.execute(select(Exam).where(Exam.id == session.exam_id))
    exam = e_result.scalar_one_or_none()

    # Get student
    s_result = await db.execute(select(Student).where(Student.id == session.student_id))
    student  = s_result.scalar_one_or_none()

    # Get questions and decrypt to build answer key
    q_result = await db.execute(
        select(Question).where(Question.exam_id == session.exam_id)
    )
    questions = q_result.scalars().all()

    from utils.crypto import decrypt_question
    aes_key    = bytes.fromhex(data.aes_key_hex)
    answer_key = {}

    for q in questions:
        try:
            encrypted = json.loads(q.encrypted_data)
            plaintext = decrypt_question(encrypted, aes_key)
            answer_key[q.id] = plaintext["correct"]
        except Exception:
            continue

    # Score
    answers     = session.answers or []
    total_marks = exam.total_marks
    marks_per_q = total_marks / max(len(answer_key), 1)
    score       = 0.0

    for ans in answers:
        q_id    = ans.get("q_id")
        student_ans = ans.get("answer")
        correct_ans = answer_key.get(q_id)
        if correct_ans and str(student_ans).upper() == str(correct_ans).upper():
            score += marks_per_q

    score      = round(score)
    percentage = round(score / total_marks * 100, 2)

    # Generate VC
    import uuid
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc).isoformat()
    vc  = {
        "@context":  ["https://www.w3.org/2018/credentials/v1"],
        "id":        f"urn:uuid:{uuid.uuid4()}",
        "type":      ["VerifiableCredential", "ExamResultCredential"],
        "issuer":    {"id": "did:examchain:issuer", "name": "ExamChain"},
        "issuanceDate": now,
        "credentialSubject": {
            "id":         student.did,
            "name":       student.name,
            "examId":     exam.id,
            "examTitle":  exam.title,
            "score":      score,
            "totalMarks": total_marks,
            "percentage": percentage,
            "status":     "FLAGGED" if session.is_flagged else "VERIFIED"
        }
    }


@router.post("/certify-live")
async def certify_live_result(
    data: CertifyLiveRequest,
    db:   AsyncSession = Depends(get_db),
    user: dict         = Depends(get_current_user)
):
    result = await db.execute(select(ExamSession).where(ExamSession.id == data.session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if user.get("role") == "student" and session.student_id != user["sub"]:
        raise HTTPException(status_code=403, detail="Not your session")
    if session.status == "ACTIVE":
        session.status = "COMPLETED"
        from datetime import datetime
        session.ended_at = datetime.utcnow()
        await db.commit()

    return await _certify_from_hashed_answers(session, db)
    vc_json = json.dumps(vc, separators=(",", ":"))
    vc_hash = "0x" + hashlib.sha256(vc_json.encode()).hexdigest()

    # Write to blockchain
    tx_hash = "0x" + "0" * 64
    try:
        from utils.blockchain import get_web3, get_result_certifier
        from config import get_settings
        settings  = get_settings()
        w3        = get_web3()
        certifier = get_result_certifier()
        account   = w3.eth.accounts[0]

        exam_bytes = bytes.fromhex(
            hashlib.sha256(exam.id.encode()).hexdigest()
        )
        did_bytes  = bytes.fromhex(
            hashlib.sha256(student.did.encode()).hexdigest()
        )
        vc_bytes   = bytes.fromhex(vc_hash.replace("0x", ""))

        fn = certifier.functions.certifyResult(
            exam_bytes, did_bytes, score, total_marks,
            vc_bytes, session.is_flagged
        )
        tx      = fn.transact({"from": account})
        receipt = w3.eth.wait_for_transaction_receipt(tx)
        tx_hash = receipt.transactionHash.hex()
    except Exception as e:
        tx_hash = f"blockchain_error: {str(e)}"

    # Generate QR
    import qrcode, base64
    from io import BytesIO
    qr_data = f"http://localhost:5173/verify?did={student.did}&exam={exam.id}&hash={vc_hash}"
    qr      = qrcode.QRCode(version=1, box_size=6, border=2)
    qr.add_data(qr_data)
    qr.make(fit=True)
    img    = qr.make_image(fill_color="black", back_color="white")
    buf    = BytesIO()
    img.save(buf, format="PNG")
    qr_b64 = base64.b64encode(buf.getvalue()).decode()

    # Save result to DB
    db_result = Result(
        student_id    = session.student_id,
        exam_id       = session.exam_id,
        score         = score,
        total_marks   = total_marks,
        percentage    = percentage,
        is_flagged    = session.is_flagged,
        vc_json       = vc_json,
        vc_hash       = vc_hash,
        chain_tx_hash = tx_hash
    )
    db.add(db_result)
    await db.commit()

    return {
        "session_id":  data.session_id,
        "student_name":student.name,
        "student_did": student.did,
        "exam_title":  exam.title,
        "score":       score,
        "total_marks": total_marks,
        "percentage":  percentage,
        "is_flagged":  session.is_flagged,
        "vc_hash":     vc_hash,
        "chain_tx":    tx_hash,
        "qr_base64":   qr_b64,
        "qr_data":     qr_data,
        "vc":          vc
    }


@router.get("/student/{student_id}")
async def get_student_results(
    student_id: str,
    db:         AsyncSession = Depends(get_db),
    user:       dict         = Depends(get_current_user)
):
    result = await db.execute(
        select(Result).where(Result.student_id == student_id)
    )
    results = result.scalars().all()
    return [
        {
            "exam_id":    r.exam_id,
            "score":      r.score,
            "total":      r.total_marks,
            "percentage": r.percentage,
            "is_flagged": r.is_flagged,
            "vc_hash":    r.vc_hash,
            "chain_tx":   r.chain_tx_hash,
            "certified_at": r.certified_at.isoformat()
        }
        for r in results
    ]


@router.get("/verify")
async def verify_credential(
    did:     str,
    exam_id: str,
    hash:    str,
    db:      AsyncSession = Depends(get_db)
):
    """Public endpoint — no auth required. Verify a credential."""
    result = await db.execute(
        select(Result).where(
            Result.exam_id == exam_id,
            Result.vc_hash == hash
        )
    )
    r = result.scalar_one_or_none()
    if not r:
        return {"verified": False, "message": "Credential not found"}

    # Verify on blockchain
    try:
        from utils.blockchain import get_web3, get_result_certifier
        w3        = get_web3()
        certifier = get_result_certifier()
        exam_bytes = bytes.fromhex(hashlib.sha256(exam_id.encode()).hexdigest())
        did_bytes  = bytes.fromhex(hashlib.sha256(did.encode()).hexdigest())
        vc_bytes   = bytes.fromhex(hash.replace("0x", ""))
        on_chain   = certifier.functions.verifyCredential(
            exam_bytes, did_bytes, vc_bytes
        ).call()
    except Exception:
        on_chain = False

    return {
        "verified":      on_chain or bool(r.chain_tx_hash),
        "student_did":   did,
        "exam_id":       exam_id,
        "score":         r.score,
        "total_marks":   r.total_marks,
        "percentage":    r.percentage,
        "is_flagged":    r.is_flagged,
        "certified_at":  r.certified_at.isoformat(),
        "chain_tx":      r.chain_tx_hash,
        "vc_hash":       r.vc_hash
    }
