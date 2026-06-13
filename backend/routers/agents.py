from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import List
import json

from utils.database import get_db
from utils.auth import get_current_user
from utils.redis_client import get_redis
from models.db_models import AgentEvent, ExamSession

router = APIRouter()


# ── Schemas ────────────────────────────────────────────────────

class FrameAnalysisRequest(BaseModel):
    session_id:  str
    frame_b64:   str    # Base64 encoded webcam frame


class BrowserEventRequest(BaseModel):
    session_id: str
    event_type: str     # tab_switch, focus_lost, right_click, etc.
    detail:     dict = {}


# ── Agent Status ───────────────────────────────────────────────

@router.get("/status/{exam_id}")
async def get_agent_status(
    exam_id: str,
    db:      AsyncSession = Depends(get_db),
    user:    dict         = Depends(get_current_user)
):
    """Get live status of all agents for an exam."""
    result = await db.execute(
        select(AgentEvent)
        .where(AgentEvent.session_id.in_(
            select(ExamSession.id).where(ExamSession.exam_id == exam_id)
        ))
        .order_by(AgentEvent.created_at.desc())
        .limit(50)
    )
    events = result.scalars().all()

    # Count by severity
    critical = sum(1 for e in events if e.severity == "CRITICAL")
    warnings  = sum(1 for e in events if e.severity == "WARNING")

    return {
        "exam_id":        exam_id,
        "total_events":   len(events),
        "critical_flags": critical,
        "warnings":       warnings,
        "agents_active":  ["INTEGRITY_MONITOR", "ADAPTIVE_SELECTOR",
                           "ENVIRONMENT_AUDITOR", "RESULT_CERTIFIER"],
        "recent_events": [
            {
                "session_id": e.session_id,
                "agent":      e.agent_name,
                "event_type": e.event_type,
                "severity":   e.severity,
                "payload":    e.payload,
                "timestamp":  e.created_at.isoformat()
            }
            for e in events[:10]
        ]
    }


@router.get("/flags/{exam_id}")
async def get_integrity_flags(
    exam_id: str,
    db:      AsyncSession = Depends(get_db),
    user:    dict         = Depends(get_current_user)
):
    """Get all integrity flags for an exam — for admin dashboard."""
    result = await db.execute(
        select(AgentEvent, ExamSession)
        .join(ExamSession, AgentEvent.session_id == ExamSession.id)
        .where(ExamSession.exam_id == exam_id)
        .where(AgentEvent.severity.in_(["WARNING", "CRITICAL"]))
        .order_by(AgentEvent.created_at.desc())
    )
    rows = result.all()

    return [
        {
            "session_id": row.AgentEvent.session_id,
            "student_id": row.ExamSession.student_id,
            "agent":      row.AgentEvent.agent_name,
            "event_type": row.AgentEvent.event_type,
            "severity":   row.AgentEvent.severity,
            "payload":    row.AgentEvent.payload,
            "timestamp":  row.AgentEvent.created_at.isoformat()
        }
        for row in rows
    ]


@router.post("/browser-event")
async def record_browser_event(
    data: BrowserEventRequest,
    db:   AsyncSession = Depends(get_db),
    user: dict         = Depends(get_current_user)
):
    """Record browser lockdown events from frontend."""
    result = await db.execute(
        select(ExamSession).where(ExamSession.id == data.session_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Risk weights per event type
    risk_weights = {
        "tab_switch":     0.05,
        "focus_lost":     0.08,
        "right_click":    0.02,
        "copy_paste":     0.10,
        "resize":         0.02,
        "devtools_open":  0.20,
    }
    weight = risk_weights.get(data.event_type, 0.03)

    # Update environment score
    new_score = max(0.0, session.environment_score - weight)
    session.environment_score = new_score

    # Flag if score drops below threshold
    if new_score < 0.5 and not session.is_flagged:
        session.is_flagged  = True
        session.flag_reason = f"Environment risk threshold exceeded: {data.event_type}"

    # Log agent event
    event = AgentEvent(
        session_id = data.session_id,
        agent_name = "ENVIRONMENT_AUDITOR",
        event_type = data.event_type.upper(),
        severity   = "WARNING" if weight > 0.05 else "INFO",
        payload    = {
            "event_type":       data.event_type,
            "risk_weight":      weight,
            "new_env_score":    new_score,
            "detail":           data.detail
        }
    )
    db.add(event)
    await db.commit()

    # Publish to Redis for real-time dashboard
    redis = get_redis()
    if redis:
        await redis.publish(
            f"exam:{session.exam_id}:agent_events",
            json.dumps({
                "type":        "ENVIRONMENT_FLAG",
                "session_id":  data.session_id,
                "event_type":  data.event_type,
                "env_score":   new_score,
                "severity":    event.severity,
                "timestamp":   event.created_at.isoformat() if event.created_at else ""
            })
        )

    return {
        "success":          True,
        "event_type":       data.event_type,
        "environment_score":new_score,
        "is_flagged":       session.is_flagged
    }


@router.get("/session-risk/{session_id}")
async def get_session_risk(
    session_id: str,
    db:         AsyncSession = Depends(get_db),
    user:       dict         = Depends(get_current_user)
):
    """Get full risk profile for a session."""
    result = await db.execute(
        select(ExamSession).where(ExamSession.id == session_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Get all events for this session
    e_result = await db.execute(
        select(AgentEvent)
        .where(AgentEvent.session_id == session_id)
        .order_by(AgentEvent.created_at.desc())
    )
    events = e_result.scalars().all()

    return {
        "session_id":       session_id,
        "integrity_score":  session.integrity_score,
        "environment_score":session.environment_score,
        "behavior_score":   session.behavior_score,
        "is_flagged":       session.is_flagged,
        "flag_reason":      session.flag_reason,
        "total_events":     len(events),
        "critical_count":   sum(1 for e in events if e.severity == "CRITICAL"),
        "warning_count":    sum(1 for e in events if e.severity == "WARNING"),
        "events": [
            {
                "agent":      e.agent_name,
                "event_type": e.event_type,
                "severity":   e.severity,
                "timestamp":  e.created_at.isoformat()
            }
            for e in events
        ]
    }