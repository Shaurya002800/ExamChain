from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # App
    app_name: str = "ExamChain"
    debug: bool = False

    # Auth
    secret_key: str = "examchain_super_secret_key_change_this"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 120

    # Database
    database_url: str = "postgresql://examchain:examchain123@localhost:5432/examchain_db"
    redis_url: str = "redis://localhost:6379"

    # Blockchain
    ganache_url: str = "http://127.0.0.1:8545"
    chain_id: int = 1337
    deployer_private_key: str = ""
    question_vault_address: str = ""
    result_certifier_address: str = ""

    # Backend
    backend_port: int = 8000

    class Config:
        env_file = "../.env"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()