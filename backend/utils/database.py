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
            await conn.execute(text("ALTER TABLE exams ADD COLUMN IF NOT EXISTS ledger_mode VARCHAR(30) DEFAULT 'LOCAL_LEDGER'"))
            await conn.execute(text("ALTER TABLE exams ADD COLUMN IF NOT EXISTS ledger_error TEXT"))
            await conn.execute(text("ALTER TABLE questions ADD COLUMN IF NOT EXISTS public_payload JSON"))
            await conn.execute(text("ALTER TABLE questions ADD COLUMN IF NOT EXISTS correct_answer_hash VARCHAR(66)"))
            await conn.execute(text("ALTER TABLE questions ADD COLUMN IF NOT EXISTS points DOUBLE PRECISION DEFAULT 1.0"))


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
