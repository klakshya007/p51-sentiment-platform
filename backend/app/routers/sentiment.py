from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models import Post, SentimentSummary
from app.services.db import get_db

router = APIRouter(prefix="/api/sentiment", tags=["sentiment"])


@router.get("/summary", response_model=SentimentSummary)
def summary(keyword: str | None = None, db: Session = Depends(get_db)):
    q = db.query(Post)
    if keyword:
        q = q.filter(Post.keyword == keyword)

    rows = q.with_entities(Post.sentiment_label, func.count()).group_by(Post.sentiment_label).all()
    counts = {label: count for label, count in rows}

    positive = counts.get("positive", 0)
    neutral = counts.get("neutral", 0)
    negative = counts.get("negative", 0)
    total = positive + neutral + negative

    return SentimentSummary(
        keyword=keyword,
        positive=positive,
        neutral=neutral,
        negative=negative,
        total=total,
        negative_ratio=(negative / total) if total else 0.0,
    )


@router.get("/trending")
def trending_keywords(limit: int = 10, db: Session = Depends(get_db)):
    """Keyword frequency over stored posts — powers the 'trending topics' widget."""
    rows = (
        db.query(Post.keyword, func.count().label("count"))
        .group_by(Post.keyword)
        .order_by(func.count().desc())
        .limit(limit)
        .all()
    )
    return [{"keyword": k, "count": c} for k, c in rows]


@router.get("/timeseries")
def timeseries(keyword: str | None = None, db: Session = Depends(get_db)):
    """Sentiment counts bucketed by hour — powers the trend line chart."""
    q = db.query(Post)
    if keyword:
        q = q.filter(Post.keyword == keyword)
    posts = q.order_by(Post.created_at.asc()).all()

    buckets: dict[str, dict[str, int]] = {}
    for p in posts:
        key = p.created_at.strftime("%Y-%m-%d %H:00")
        bucket = buckets.setdefault(key, {"positive": 0, "neutral": 0, "negative": 0})
        bucket[p.sentiment_label] = bucket.get(p.sentiment_label, 0) + 1

    return [{"time": t, **counts} for t, counts in sorted(buckets.items())]
