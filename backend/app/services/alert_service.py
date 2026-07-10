"""
Negative-sentiment spike detection.

Simple, explainable rule (good for a viva): within a rolling time window,
if the share of negative posts for a keyword crosses a threshold, raise
one alert. We avoid re-alerting every single fetch by checking whether an
alert for that keyword already fired in the current window.
"""
from datetime import datetime, timedelta, timezone

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models import Alert, Post

settings = get_settings()


def check_and_raise_alert(db: Session, keyword: str) -> Alert | None:
    window_start = datetime.now(timezone.utc) - timedelta(minutes=settings.alert_window_minutes)

    q = db.query(Post).filter(Post.keyword == keyword, Post.fetched_at >= window_start)
    total = q.count()
    if total == 0:
        return None

    negative = q.filter(Post.sentiment_label == "negative").count()
    ratio = negative / total

    if ratio < settings.negative_spike_threshold:
        return None

    # Don't spam duplicate alerts inside the same window
    existing = (
        db.query(Alert)
        .filter(Alert.keyword == keyword, Alert.triggered_at >= window_start)
        .first()
    )
    if existing:
        return None

    sample_ids = [p.id for p in q.filter(Post.sentiment_label == "negative").limit(5).all()]

    alert = Alert(
        keyword=keyword,
        negative_ratio=ratio,
        window_minutes=settings.alert_window_minutes,
        sample_post_ids=",".join(sample_ids),
        message=(
            f"Negative sentiment spike for '{keyword}': "
            f"{negative}/{total} posts ({ratio:.0%}) negative in the last "
            f"{settings.alert_window_minutes} minutes."
        ),
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert
