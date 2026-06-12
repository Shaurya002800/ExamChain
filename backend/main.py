from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("examchain")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 ExamChain backend starting...")
    from utils.database import init_db
    from utils.redis_client import init_redis
    import models.db_models  # ensure tables are registered
    await init_db()
    await init_redis()
    logger.info("✅ Database and Redis connected")
    yield
    logger.info("🛑 ExamChain backend shutting down")


app = FastAPI(
    title="ExamChain API",
    description="Zero-trust examination infrastructure",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from routers import auth, exams, questions, sessions, results
app.include_router(auth.router,      prefix="/api/auth",      tags=["Auth"])
app.include_router(exams.router,     prefix="/api/exams",     tags=["Exams"])
app.include_router(questions.router, prefix="/api/questions", tags=["Questions"])
app.include_router(sessions.router,  prefix="/api/sessions",  tags=["Sessions"])
app.include_router(results.router,   prefix="/api/results",   tags=["Results"])


@app.get("/")
async def root():
    return {
        "project": "ExamChain",
        "version": "1.0.0",
        "status": "running",
        "tagline": "Zero-trust. Autonomous. Verifiable."
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}