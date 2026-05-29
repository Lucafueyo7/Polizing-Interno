from collections.abc import Generator

from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import get_settings


settings = get_settings()

_is_postgres = not settings.database_url.startswith("sqlite")
connect_args = {"check_same_thread": False} if not _is_postgres else {}

engine = create_engine(settings.database_url, connect_args=connect_args)

# When using Postgres (production / Supabase), isolate all chatbot tables inside
# the "chatbot" schema so they don't collide with the Prisma-managed "public" schema.
if _is_postgres:
    @event.listens_for(engine, "connect")
    def _set_search_path(dbapi_conn, _connection_record) -> None:  # type: ignore[misc]
        with dbapi_conn.cursor() as cur:
            cur.execute("CREATE SCHEMA IF NOT EXISTS chatbot")
            cur.execute("SET search_path TO chatbot")
        dbapi_conn.commit()

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    pass


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    from app import models  # noqa: F401

    Base.metadata.create_all(bind=engine)
