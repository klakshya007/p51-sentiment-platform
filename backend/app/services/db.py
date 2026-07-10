"""
Database session management.

Default: local SQLite file, zero setup required.
Azure: point DATABASE_URL at Azure Database for PostgreSQL, or set
USE_COSMOS=true and wire up services/cosmos_service.py instead (Cosmos DB's
document API doesn't speak SQLAlchemy, so that adapter is kept separate and
implements the same functions this module exposes).
"""
from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.config import get_settings
from app.models import Base

settings = get_settings()

connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
engine = create_engine(settings.database_url, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db() -> None:
    Base.metadata.create_all(bind=engine)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
