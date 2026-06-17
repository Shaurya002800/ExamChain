from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, EmailStr
from utils.database import get_db
from utils.auth import hash_password, verify_password, create_access_token
from utils.crypto import generate_did
from models.db_models import Student, Examiner, Tenant
import re

router = APIRouter()


# ── Schemas ────────────────────────────────────────────────────

class StudentRegister(BaseModel):
    name:     str
    email:    EmailStr
    password: str
    tenant_slug: str = "default"

class ExaminerRegister(BaseModel):
    name:        str
    email:       EmailStr
    password:    str
    institution: str = ""
    tenant_slug: str | None = None

class LoginRequest(BaseModel):
    email:    EmailStr
    password: str


def _slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or "default"


async def _get_or_create_tenant(db: AsyncSession, name: str = "ExamChain Default", slug: str = "default") -> Tenant:
    slug = _slugify(slug)
    result = await db.execute(select(Tenant).where(Tenant.slug == slug))
    tenant = result.scalar_one_or_none()
    if tenant:
        return tenant
    tenant_data = {
        "name": name or slug.replace("-", " ").title(),
        "slug": slug,
    }
    if slug == "default":
        tenant_data["id"] = "default"
    tenant = Tenant(**tenant_data)
    db.add(tenant)
    await db.flush()
    return tenant


# ── Student Auth ───────────────────────────────────────────────

@router.post("/student/register")
async def register_student(data: StudentRegister, db: AsyncSession = Depends(get_db)):
    # Check duplicate
    result = await db.execute(select(Student).where(Student.email == data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    tenant = await _get_or_create_tenant(db, slug=data.tenant_slug)

    student = Student(
        tenant_id     = tenant.id,
        name          = data.name,
        email         = data.email,
        password_hash = hash_password(data.password),
        did           = generate_did(data.email)
    )
    db.add(student)
    await db.commit()
    await db.refresh(student)

    token = create_access_token({"sub": student.id, "role": "student", "tenant_id": student.tenant_id})
    return {"access_token": token, "token_type": "bearer",
            "student_id": student.id, "did": student.did, "tenant_id": student.tenant_id}


@router.post("/student/login")
async def login_student(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Student).where(Student.email == data.email))
    student = result.scalar_one_or_none()

    if not student or not verify_password(data.password, student.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": student.id, "role": "student", "tenant_id": student.tenant_id or "default"})
    return {"access_token": token, "token_type": "bearer",
            "student_id": student.id, "name": student.name, "did": student.did, "tenant_id": student.tenant_id or "default"}


# ── Examiner Auth ──────────────────────────────────────────────

@router.post("/examiner/register")
async def register_examiner(data: ExaminerRegister, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Examiner).where(Examiner.email == data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    tenant_name = data.institution or "ExamChain Default"
    tenant_slug = data.tenant_slug or tenant_name
    tenant = await _get_or_create_tenant(db, name=tenant_name, slug=tenant_slug)

    examiner = Examiner(
        tenant_id     = tenant.id,
        name          = data.name,
        email         = data.email,
        password_hash = hash_password(data.password),
        institution   = data.institution
    )
    db.add(examiner)
    await db.commit()
    await db.refresh(examiner)

    token = create_access_token({"sub": examiner.id, "role": "examiner", "tenant_id": examiner.tenant_id})
    return {"access_token": token, "token_type": "bearer", "examiner_id": examiner.id, "tenant_id": examiner.tenant_id}


@router.post("/examiner/login")
async def login_examiner(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Examiner).where(Examiner.email == data.email))
    examiner = result.scalar_one_or_none()

    if not examiner or not verify_password(data.password, examiner.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": examiner.id, "role": "examiner", "tenant_id": examiner.tenant_id or "default"})
    return {"access_token": token, "token_type": "bearer",
            "examiner_id": examiner.id, "name": examiner.name, "tenant_id": examiner.tenant_id or "default"}
