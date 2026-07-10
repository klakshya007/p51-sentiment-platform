"""
ORM models (SQLAlchemy) + matching Pydantic schemas.

These map 1:1 onto what would become Cosmos DB documents if/when the team
switches on `use_cosmos`. Keeping the shape identical means the frontend
and routers never need to change.
"""
from datetime import datetime, timezone

from pydantic import BaseModel, Field
from sqlalchemy import Column, DateTime, Float, Integer, String
from sqlalchemy.orm import declarative_base

Base = declarative_base()


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Post(Base):
    __tablename__ = "posts"

    id = Column(String, primary_key=True)            # reddit post id (t3_xxx)
    source = Column(String, default="reddit")
    subreddit = Column(String, index=True)
    keyword = Column(String, index=True)
    author = Column(String)
    title = Column(String)
    text = Column(String)
    url = Column(String)
    created_at = Column(DateTime, index=True)          # original post time
    fetched_at = Column(DateTime, default=utcnow)

    sentiment_label = Column(String, index=True)        # positive | neutral | negative
    sentiment_score = Column(Float)                      # confidence 0-1
    score = Column(Integer, default=0)                   # reddit upvotes


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    keyword = Column(String, index=True)
    triggered_at = Column(DateTime, default=utcnow, index=True)
    negative_ratio = Column(Float)
    window_minutes = Column(Integer)
    sample_post_ids = Column(String)  # comma-separated ids for quick reference
    message = Column(String)


# ---------- Pydantic schemas (API contracts) ----------

class PostOut(BaseModel):
    id: str
    source: str
    subreddit: str | None = None
    keyword: str | None = None
    author: str | None = None
    title: str | None = None
    text: str | None = None
    url: str | None = None
    created_at: datetime
    sentiment_label: str
    sentiment_score: float
    score: int = 0

    class Config:
        from_attributes = True


class AlertOut(BaseModel):
    id: int
    keyword: str
    triggered_at: datetime
    negative_ratio: float
    window_minutes: int
    message: str

    class Config:
        from_attributes = True


class SentimentSummary(BaseModel):
    keyword: str | None
    positive: int
    neutral: int
    negative: int
    total: int
    negative_ratio: float


class FetchRequest(BaseModel):
    keyword: str = Field(..., min_length=1, description="Search term / brand / topic")
    subreddit: str = Field(default="all", description="Subreddit to search, or 'all'")
    limit: int = Field(default=25, ge=1, le=100)
