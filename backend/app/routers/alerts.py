from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.models import Alert, AlertOut
from app.services.db import get_db

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


@router.get("", response_model=list[AlertOut])
def list_alerts(limit: int = 50, db: Session = Depends(get_db)):
    return db.query(Alert).order_by(Alert.triggered_at.desc()).limit(limit).all()
