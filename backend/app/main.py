from contextlib import asynccontextmanager

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.models import FetchRequest
from app.routers import alerts, posts, sentiment
from app.services.db import SessionLocal, init_db

settings = get_settings()
scheduler = AsyncIOScheduler()


async def scheduled_fetch_job(keyword: str, subreddit: str = "all") -> None:
    """Background job so the dashboard has fresh data without manual refresh.
    Mirrors what an Azure Function on a timer trigger would do in production."""
    from app.routers.posts import fetch_and_store

    db = SessionLocal()
    try:
        await fetch_and_store(FetchRequest(keyword=keyword, subreddit=subreddit), db)
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    scheduler.start()
    yield
    scheduler.shutdown()


app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.allowed_origins.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(posts.router)
app.include_router(sentiment.router)
app.include_router(alerts.router)


@app.get("/api/health")
def health():
    return {"status": "ok", "app": settings.app_name, "environment": settings.environment}


@app.post("/api/watch/{keyword}")
def watch_keyword(keyword: str, subreddit: str = "all"):
    """Register a keyword for automatic polling every FETCH_INTERVAL_SECONDS."""
    job_id = f"watch-{keyword}-{subreddit}"
    scheduler.add_job(
        scheduled_fetch_job,
        "interval",
        seconds=settings.fetch_interval_seconds,
        args=[keyword, subreddit],
        id=job_id,
        replace_existing=True,
    )
    return {"status": "watching", "keyword": keyword, "subreddit": subreddit}


@app.delete("/api/watch/{keyword}")
def unwatch_keyword(keyword: str, subreddit: str = "all"):
    job_id = f"watch-{keyword}-{subreddit}"
    if scheduler.get_job(job_id):
        scheduler.remove_job(job_id)
    return {"status": "stopped", "keyword": keyword}
