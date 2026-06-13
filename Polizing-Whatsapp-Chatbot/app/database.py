from collections.abc import Generator

from sqlalchemy import create_engine, event, inspect, text
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
    _run_lightweight_migrations()


# `create_all` crea tablas faltantes pero NO agrega columnas nuevas a tablas ya
# existentes. Como el chatbot no usa un framework de migraciones, aplicamos acá
# parches aditivos idempotentes (sólo ADD COLUMN). Portable Postgres/SQLite.
#
# Formato: (tabla, columna, "ALTER ... ADD COLUMN ...").
_COLUMN_MIGRATIONS: list[tuple[str, str, str]] = [
    (
        "mock_clients",
        "is_corporate",
        "ALTER TABLE mock_clients ADD COLUMN is_corporate BOOLEAN NOT NULL DEFAULT TRUE",
    ),
]


def _run_lightweight_migrations() -> None:
    schema = "chatbot" if _is_postgres else None
    inspector = inspect(engine)
    for table, column, ddl in _COLUMN_MIGRATIONS:
        if not inspector.has_table(table, schema=schema):
            continue
        existing = {col["name"] for col in inspector.get_columns(table, schema=schema)}
        if column in existing:
            continue
        with engine.begin() as conn:
            conn.execute(text(ddl))
