import os
import logging
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

logger = logging.getLogger("resqvision.db")

# Load environment variables from .env file
env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./disaster_dispatch.db")

# Normalize Postgres connection strings:
# Supabase/Neon/Heroku often provide postgres:// or postgresql://
# If psycopg 3 is installed, sqlalchemy needs postgresql+psycopg:// unless driver is default
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg://", 1)
elif DATABASE_URL.startswith("postgresql://") and not DATABASE_URL.startswith("postgresql+"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)

# SQLite-specific connect args
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

try:
    engine = create_engine(
        DATABASE_URL,
        connect_args=connect_args,
        pool_pre_ping=True,
    )
except Exception as e:
    logger.warning(
        f"Failed to initialize database engine with URL '{DATABASE_URL}': {e}. "
        "Falling back to local SQLite engine."
    )
    DATABASE_URL = "sqlite:///./disaster_dispatch.db"
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        pool_pre_ping=True,
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """FastAPI dependency for obtaining a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create all tables in the database if they do not already exist."""
    from app.db import models  # noqa: F401
    Base.metadata.create_all(bind=engine)
    logger.info(f"Database initialized successfully with URL pattern: {DATABASE_URL.split('@')[-1] if '@' in DATABASE_URL else DATABASE_URL}")
