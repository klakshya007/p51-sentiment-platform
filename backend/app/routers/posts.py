from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.models import FetchRequest, Post, PostOut
from app.services import reddit_service
from app.services.alert_service import check_and_raise_alert
from app.services.db import get_db
from app.services.sentiment_service import classify

router = APIRouter(prefix="/api/posts", tags=["posts"])


@router.post("/fetch", response_model=list[PostOut])
async def fetch_and_store(req: FetchRequest, db: Session = Depends(get_db)):
    """Pull fresh posts for a keyword, classify sentiment, store, check alerts."""
    raw_posts = await reddit_service.fetch_posts(req.keyword, req.subreddit, req.limit)

    stored: list[Post] = []
    for p in raw_posts:
        if db.query(Post).filter(Post.id == p["id"]).first():
            continue  # already have it

        label, score = classify(p["text"])
        post = Post(
            id=p["id"],
            source="reddit",
            subreddit=p["subreddit"],
            keyword=req.keyword,
            author=p["author"],
            title=p["title"],
            text=p["text"],
            url=p["url"],
            created_at=p["created_at"],
            sentiment_label=label,
            sentiment_score=score,
            score=p["score"],
        )
        db.add(post)
        stored.append(post)

    db.commit()
    for post in stored:
        db.refresh(post)

    check_and_raise_alert(db, req.keyword)

    return stored


@router.get("", response_model=list[PostOut])
def list_posts(
    keyword: str | None = None,
    sentiment: str | None = None,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    q = db.query(Post)
    if keyword:
        q = q.filter(Post.keyword.ilike(f"%{keyword}%"))
    if sentiment:
        q = q.filter(Post.sentiment_label == sentiment)
    return q.order_by(Post.created_at.desc()).limit(limit).all()


@router.get("/{post_id}", response_model=PostOut)
def get_post(post_id: str, db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post
