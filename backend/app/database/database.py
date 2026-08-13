from __future__ import annotations

from pathlib import Path
from typing import Generator

from sqlalchemy import Engine, create_engine, event
from sqlalchemy.orm import (
    DeclarativeBase,
    Session,
    sessionmaker,
)


PROJECT_ROOT = Path(__file__).resolve().parents[3]

DEFAULT_DATABASE_PATH = (
    PROJECT_ROOT
    / "backend"
    / "scopediff.db"
)

DEFAULT_DATABASE_URL = (
    f"sqlite:///{DEFAULT_DATABASE_PATH.as_posix()}"
)


class Base(DeclarativeBase):
    pass


def build_engine(
    database_url: str = DEFAULT_DATABASE_URL,
) -> Engine:
    """
    ScopeDiff için SQLAlchemy engine oluşturur.
    """

    connect_args = {}

    if database_url.startswith("sqlite"):
        connect_args["check_same_thread"] = False

    engine = create_engine(
        database_url,
        connect_args=connect_args,
    )

    if database_url.startswith("sqlite"):

        @event.listens_for(
            engine,
            "connect",
        )
        def enable_sqlite_foreign_keys(
            dbapi_connection,
            connection_record,
        ) -> None:
            cursor = (
                dbapi_connection.cursor()
            )

            cursor.execute(
                "PRAGMA foreign_keys=ON"
            )

            cursor.close()

    return engine


engine = build_engine()


SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    expire_on_commit=False,
)


def get_db() -> Generator[
    Session,
    None,
    None,
]:
    """
    FastAPI endpointlerinde kullanılacak
    database session dependency.
    """

    database = SessionLocal()

    try:
        yield database
    finally:
        database.close()


def init_db(
    database_engine: Engine | None = None,
) -> None:
    """
    ScopeDiff tablolarını oluşturur.
    """

    from backend.app.database import models

    target_engine = (
        database_engine
        if database_engine is not None
        else engine
    )

    Base.metadata.create_all(
        bind=target_engine
    )