import redis.asyncio as aioredis
from config import get_settings

settings = get_settings()
redis_client = None


async def init_redis():
    global redis_client
    redis_client = aioredis.from_url(
        settings.redis_url, decode_responses=True
    )
    await redis_client.ping()


def get_redis():
    return redis_client