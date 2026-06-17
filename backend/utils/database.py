from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy import text
from config import get_settings

settings = get_settings()

db_url = settings.database_url.replace(
    "postgresql://", "postgresql+asyncpg://"
)

engine = create_async_engine(db_url, echo=settings.debug)
AsyncSessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)
Base = declarative_base()


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # Lightweight schema evolution for hackathon/pilot deployments without Alembic yet.
        # Safe on PostgreSQL; ignored by SQLite-style URLs during local experiments.
        if db_url.startswith("postgresql+asyncpg://"):
            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS tenants (
                    id VARCHAR PRIMARY KEY,
                    name VARCHAR(200) NOT NULL,
                    slug VARCHAR(120) UNIQUE NOT NULL,
                    logo_url TEXT,
                    primary_color VARCHAR(20) DEFAULT '#0EA5E9',
                    created_at TIMESTAMP DEFAULT now()
                )
            """))
            await conn.execute(text("""
                INSERT INTO tenants (id, name, slug, primary_color)
                VALUES ('default', 'ExamChain Default', 'default', '#0EA5E9')
                ON CONFLICT (id) DO NOTHING
            """))
            await conn.execute(text("ALTER TABLE students ADD COLUMN IF NOT EXISTS tenant_id VARCHAR DEFAULT 'default'"))
            await conn.execute(text("ALTER TABLE examiners ADD COLUMN IF NOT EXISTS tenant_id VARCHAR DEFAULT 'default'"))
            await conn.execute(text("ALTER TABLE exams ADD COLUMN IF NOT EXISTS tenant_id VARCHAR DEFAULT 'default'"))
            await conn.execute(text("ALTER TABLE exams ADD COLUMN IF NOT EXISTS ledger_mode VARCHAR(30) DEFAULT 'LOCAL_LEDGER'"))
            await conn.execute(text("ALTER TABLE exams ADD COLUMN IF NOT EXISTS ledger_error TEXT"))
            await conn.execute(text("ALTER TABLE questions ADD COLUMN IF NOT EXISTS public_payload JSON"))
            await conn.execute(text("ALTER TABLE questions ADD COLUMN IF NOT EXISTS correct_answer_hash VARCHAR(66)"))
            await conn.execute(text("ALTER TABLE questions ADD COLUMN IF NOT EXISTS points DOUBLE PRECISION DEFAULT 1.0"))
            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS exam_keys (
                    id VARCHAR PRIMARY KEY,
                    exam_id VARCHAR UNIQUE NOT NULL REFERENCES exams(id),
                    tenant_id VARCHAR DEFAULT 'default',
                    encrypted_key TEXT NOT NULL,
                    key_fingerprint VARCHAR(66) NOT NULL,
                    status VARCHAR(20) DEFAULT 'ACTIVE',
                    created_at TIMESTAMP DEFAULT now()
                )
            """))
            await conn.execute(text("ALTER TABLE results ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'PENDING'"))
            await conn.execute(text("ALTER TABLE results ADD COLUMN IF NOT EXISTS reviewed_by VARCHAR"))
            await conn.execute(text("ALTER TABLE results ADD COLUMN IF NOT EXISTS review_note TEXT"))
            await conn.execute(text("UPDATE students SET tenant_id = 'default' WHERE tenant_id IS NULL"))
            await conn.execute(text("UPDATE examiners SET tenant_id = 'default' WHERE tenant_id IS NULL"))
            await conn.execute(text("UPDATE exams SET tenant_id = 'default' WHERE tenant_id IS NULL"))
            await conn.execute(text("UPDATE results SET status = 'CERTIFIED' WHERE status IS NULL AND vc_hash IS NOT NULL"))


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
