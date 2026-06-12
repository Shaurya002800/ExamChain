from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone
import json

from utils.database import get_db
from utils.auth import get_current_user
from utils.redis_client import get_redis
from models.db_models import ExamSession, Exam, Student, Question, AgentEvent

router = APIRouter()

# In-memory store of active sessions per exam
# exam_id -> {session_id -> IntegrityMonitor instance}
active_monitors = {}


# ── Schemas ────────────────────────────────────────────────────

class StartSessionRequest(BaseModel):
    exam_id: str

class SubmitAnswerRequest(BaseModel):
    session_id:     str
    question_id:    str
    answer:         str        # "A", "B", "C", or "D"
    time_spent_ms:  int
    changed:        bool = False

class BehaviorEventRequest(BaseModel):
    session_id: str
    events:     list           # Raw browser behavior events


# ── Start Session ──────────────────────────────────────────────

@router.post("/start")
async def start_session(
    data: StartSessionRequest,
    db:   AsyncSession = Depends(get_db),
    user: dict         = Depends(get_current_user)
):
    if user.get("role") != "student":
        raise HTTPException(status_code=403, detail="Only students can start sessions")

    # Get exam
    result = await db.execute(select(Exam).where(Exam.id == data.exam_id))
    exam = result.scalar_one_or_none()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    if exam.status not in ("LOCKED", "ACTIVE"):
        raise HTTPException(status_code=400, detail="Exam is not available yet")

    # Get student
    result = await db.execute(select(Student).where(Student.id == user["sub"]))
    student = result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Check no existing active session
    result = await db.execute(
        select(ExamSession).where(
            ExamSession.exam_id   == data.exam_id,
            ExamSession.student_id== user["sub"],
            ExamSession.status    == "ACTIVE"
        )
    )
    existing = result.scalar_one_or_none()
    if existing:
        return {"session_id": existing.id, "message": "Resuming existing session"}

    # Get questions for this exam
    q_result = await db.execute(
        select(Question).where(Question.exam_id == data.exam_id)
    )
    questions = q_result.scalars().all()
    if not questions:
        raise HTTPException(status_code=400, detail="No questions in this exam")

    # Use adaptive selector to get initial question order
    from agents.adaptive_selector import AdaptiveQuestionSelector
    selector = AdaptiveQuestionSelector([
        {
            "id":            q.id,
            "difficulty":    q.difficulty,
            "discrimination":q.discrimination,
            "guessing":      q.guessing
        }
        for q in questions
    ])
    question_order = selector.select_initial_set(n=min(len(questions), 10))

    # Create session
    session = ExamSession(
        student_id     = user["sub"],
        exam_id        = data.exam_id,
        question_order = question_order,
        answers        = [],
        status         = "ACTIVE"
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)

    # Start integrity monitor for this exam if not already running
    if data.exam_id not in active_monitors:
        active_monitors[data.exam_id] = {}

    return {
        "session_id":     session.id,
        "exam_id":        data.exam_id,
        "question_order": question_order,
        "total_questions":len(question_order),
        "duration_mins":  exam.duration_mins,
        "started_at":     session.started_at.isoformat()
    }


# ── Submit Answer ──────────────────────────────────────────────

@router.post("/answer")
async def submit_answer(
    data: SubmitAnswerRequest,
    db:   AsyncSession = Depends(get_db),
    user: dict         = Depends(get_current_user)
):
    result = await db.execute(
        select(ExamSession).where(ExamSession.id == data.session_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.student_id != user["sub"]:
        raise HTTPException(status_code=403, detail="Not your session")
    if session.status != "ACTIVE":
        raise HTTPException(status_code=400, detail="Session is not active")

    # Add answer
    answers = session.answers or []
    answer_entry = {
        "q_id":          data.question_id,
        "answer":        data.answer,
        "timestamp_ms":  int(datetime.now(timezone.utc).timestamp() * 1000),
        "time_spent_ms": data.time_spent_ms,
        "changed":       data.changed
    }
    answers.append(answer_entry)
    session.answers = answers

    # Feed to integrity monitor
    redis = get_redis()
    if redis and session.exam_id in active_monitors:
        await redis.publish(
            f"exam:{session.exam_id}:answers",
            json.dumps({
                "session_id": session.id,
                "student_id": session.student_id,
                "answer":     answer_entry
            })
        )

    await db.commit()
    return {"success": True, "answers_submitted": len(answers)}


# ── End Session ────────────────────────────────────────────────

@router.post("/end")
async def end_session(
    session_id: str,
    db:         AsyncSession = Depends(get_db),
    user:       dict         = Depends(get_current_user)
):
    result = await db.execute(
        select(ExamSession).where(ExamSession.id == session_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.student_id != user["sub"]:
        raise HTTPException(status_code=403, detail="Not your session")

    session.status   = "COMPLETED"
    session.ended_at = datetime.now(timezone.utc)
    await db.commit()

    return {
        "session_id":  session_id,
        "status":      "COMPLETED",
        "ended_at":    session.ended_at.isoformat(),
        "total_answers": len(session.answers or [])
    }


# ── Get Session State ──────────────────────────────────────────

@router.get("/{session_id}")
async def get_session(
    session_id: str,
    db:         AsyncSession = Depends(get_db),
    user:       dict         = Depends(get_current_user)
):
    result = await db.execute(
        select(ExamSession).where(ExamSession.id == session_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    return {
        "session_id":       session.id,
        "exam_id":          session.exam_id,
        "status":           session.status,
        "integrity_score":  session.integrity_score,
        "environment_score":session.environment_score,
        "behavior_score":   session.behavior_score,
        "is_flagged":       session.is_flagged,
        "answers_count":    len(session.answers or []),
        "question_order":   session.question_order,
        "started_at":       session.started_at.isoformat(),
    }


# ── WebSocket — Live Agent Feed ────────────────────────────────

@router.websocket("/ws/{exam_id}")
async def exam_websocket(
    websocket: WebSocket,
    exam_id:   str
):
    """
    WebSocket endpoint for real-time agent events.
    Frontend connects here to receive live integrity flags,
    risk score updates, and agent decisions.
    """
    await websocket.accept()
    redis = get_redis()

    try:
        if redis:
            pubsub = redis.pubsub()
            await pubsub.subscribe(f"exam:{exam_id}:agent_events")

            await websocket.send_json({
                "type":    "CONNECTED",
                "exam_id": exam_id,
                "message": "Agent feed connected"
            })

            async for message in pubsub.listen():
                if message["type"] == "message":
                    data = json.loads(message["data"])
                    await websocket.send_json(data)
        else:
            await websocket.send_json({"type": "ERROR", "message": "Redis not available"})

    except WebSocketDisconnect:
        pass
    except Exception as e:
        await websocket.close()


# ── Behavior Events ────────────────────────────────────────────

@router.post("/behavior")
async def record_behavior(
    data: BehaviorEventRequest,
    db:   AsyncSession = Depends(get_db),
    user: dict         = Depends(get_current_user)
):
    """
    Receives behavioral events from frontend.
    Runs behavioral biometrics check against enrolled baseline.
    """
    result = await db.execute(
        select(ExamSession).where(ExamSession.id == data.session_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Get student baseline
    s_result = await db.execute(
        select(Student).where(Student.id == user["sub"])
    )
    student = s_result.scalar_one_or_none()

    from ml.behavior.biometrics import BehavioralBiometrics
    bm = BehavioralBiometrics()

    if student and student.behavior_baseline:
        bm.load_baseline(student.behavior_baseline)
        check = bm.check(data.events)

        # Update session behavior score
        session.behavior_score = check["confidence"]

        if check["is_anomaly"]:
            session.is_flagged  = True
            session.flag_reason = f"Behavioral anomaly detected: z_score={check['z_score']}"

            # Log agent event
            event = AgentEvent(
                session_id = data.session_id,
                agent_name = "BEHAVIORAL_AUTH",
                event_type = "ANOMALY_DETECTED",
                severity   = "WARNING",
                payload    = check
            )
            db.add(event)

        await db.commit()
        return {"success": True, "behavior_check": check}

    return {"success": True, "behavior_check": None, "message": "No baseline enrolled"}