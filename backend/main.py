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