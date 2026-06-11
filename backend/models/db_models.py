from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, JSON, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from utils.database import Base
import uuid


def gen_uuid():
    return str(uuid.uuid4())


class Student(Base):
    __tablename__ = "students"

    id                = Column(String, primary_key=True, default=gen_uuid)
    name              = Column(String(120), nullable=False)
    email             = Column(String(200), unique=True, nullable=False)
    password_hash     = Column(String, nullable=False)
    did               = Column(String(300), unique=True)
    face_encoding     = Column(Text)
    behavior_baseline = Column(JSON)
    created_at        = Column(DateTime, server_default=func.now())

    sessions = relationship("ExamSession", back_populates="student")
    results  = relationship("Result", back_populates="student")


class Examiner(Base):
    __tablename__ = "examiners"

    id            = Column(String, primary_key=True, default=gen_uuid)
    name          = Column(String(120), nullable=False)
    email         = Column(String(200), unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    institution   = Column(String(200))
    created_at    = Column(DateTime, server_default=func.now())

    exams = relationship("Exam", back_populates="creator")


class Exam(Base):
    __tablename__ = "exams"

    id             = Column(String, primary_key=True, default=gen_uuid)
    title          = Column(String(200), nullable=False)
    subject        = Column(String(100))
    creator_id     = Column(String, ForeignKey("examiners.id"))
    start_time     = Column(DateTime, nullable=False)
    end_time       = Column(DateTime, nullable=False)
    duration_mins  = Column(Integer, nullable=False)
    total_marks    = Column(Integer, default=100)
    exam_id_hash   = Column(String(66))
    merkle_root    = Column(String(66))
    vault_tx_hash  = Column(String(66))
    is_released    = Column(Boolean, default=False)
    status         = Column(String(20), default="DRAFT")
    created_at     = Column(DateTime, server_default=func.now())

    creator   = relationship("Examiner", back_populates="exams")
    questions = relationship("Question", back_populates="exam")
    sessions  = relationship("ExamSession", back_populates="exam")
    results   = relationship("Result", back_populates="exam")


class Question(Base):
    __tablename__ = "questions"

    id             = Column(String, primary_key=True, default=gen_uuid)
    exam_id        = Column(String, ForeignKey("exams.id"))
    encrypted_data = Column(Text, nullable=False)
    question_hash  = Column(String(66), unique=True)
    merkle_leaf    = Column(String(66))
    difficulty     = Column(Float, default=0.5)
    discrimination = Column(Float, default=1.0)
    guessing       = Column(Float, default=0.25)
    subject_area   = Column(String(100))
    created_at     = Column(DateTime, server_default=func.now())

    exam = relationship("Exam", back_populates="questions")


class ExamSession(Base):
    __tablename__ = "exam_sessions"

    id                = Column(String, primary_key=True, default=gen_uuid)
    student_id        = Column(String, ForeignKey("students.id"))
    exam_id           = Column(String, ForeignKey("exams.id"))
    started_at        = Column(DateTime, server_default=func.now())
    ended_at          = Column(DateTime)
    integrity_score   = Column(Float, default=1.0)
    environment_score = Column(Float, default=1.0)
    behavior_score    = Column(Float, default=1.0)
    is_flagged        = Column(Boolean, default=False)
    flag_reason       = Column(Text)
    answers           = Column(JSON)
    question_order    = Column(JSON)
    session_tx_hashes = Column(JSON)
    status            = Column(String(20), default="ACTIVE")

    student      = relationship("Student", back_populates="sessions")
    exam         = relationship("Exam", back_populates="sessions")
    agent_events = relationship("AgentEvent", back_populates="session")


class AgentEvent(Base):
    __tablename__ = "agent_events"

    id         = Column(String, primary_key=True, default=gen_uuid)
    session_id = Column(String, ForeignKey("exam_sessions.id"))
    agent_name = Column(String(50))
    event_type = Column(String(100))
    severity   = Column(String(20), default="INFO")
    payload    = Column(JSON)
    tx_hash    = Column(String(66))
    created_at = Column(DateTime, server_default=func.now())

    session = relationship("ExamSession", back_populates="agent_events")


class Result(Base):
    __tablename__ = "results"

    id           = Column(String, primary_key=True, default=gen_uuid)
    student_id   = Column(String, ForeignKey("students.id"))
    exam_id      = Column(String, ForeignKey("exams.id"))
    score        = Column(Float)
    total_marks  = Column(Integer)
    percentage   = Column(Float)
    is_flagged   = Column(Boolean, default=False)
    vc_json      = Column(Text)
    vc_hash      = Column(String(66))
    chain_tx_hash= Column(String(66))
    certified_at = Column(DateTime, server_default=func.now())

    student = relationship("Student", back_populates="results")
    exam    = relationship("Exam", back_populates="results")