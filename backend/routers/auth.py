from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, EmailStr
from utils.database import get_db
from utils.auth import hash_password, verify_password, create_access_token
from utils.crypto import generate_did
from models.db_models import Student, Examiner

router = APIRouter()


# ── Schemas ────────────────────────────────────────────────────

class StudentRegister(BaseModel):
    name:     str
    email:    EmailStr
    password: str

class ExaminerRegister(BaseModel):
    name:        str
    email:       EmailStr
    password:    str
    institution: str = ""

class LoginRequest(BaseModel):
    email:    EmailStr
    password: str


# ── Student Auth ───────────────────────────────────────────────

@router.post("/student/register")
async def register_student(data: StudentRegister, db: AsyncSession = Depends(get_db)):
    # Check duplicate
    result = await db.execute(select(Student).where(Student.email == data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    student = Student(
        name          = data.name,
        email         = data.email,
        password_hash = hash_password(data.password),
        did           = generate_did(data.email)
    )
    db.add(student)
    await db.commit()
    await db.refresh(student)

    token = create_access_token({"sub": student.id, "role": "student"})
    return {"access_token": token, "token_type": "bearer",
            "student_id": student.id, "did": student.did}


@router.post("/student/login")
async def login_student(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Student).where(Student.email == data.email))
    student = result.scalar_one_or_none()

    if not student or not verify_password(data.password, student.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": student.id, "role": "student"})
    return {"access_token": token, "token_type": "bearer",
            "student_id": student.id, "name": student.name, "did": student.did}


# ── Examiner Auth ──────────────────────────────────────────────

@router.post("/examiner/register")
async def register_examiner(data: ExaminerRegister, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Examiner).where(Examiner.email == data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    examiner = Examiner(
        name          = data.name,
        email         = data.email,
        password_hash = hash_password(data.password),
        institution   = data.institution
    )
    db.add(examiner)
    await db.commit()
    await db.refresh(examiner)

    token = create_access_token({"sub": examiner.id, "role": "examiner"})
    return {"access_token": token, "token_type": "bearer", "examiner_id": examiner.id}


@router.post("/examiner/login")
async def login_examiner(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Examiner).where(Examiner.email == data.email))
    examiner = result.scalar_one_or_none()

    if not examiner or not verify_password(data.password, examiner.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": examiner.id, "role": "examiner"})
    return {"access_token": token, "token_type": "bearer",
            "examiner_id": examiner.id, "name": examiner.name}