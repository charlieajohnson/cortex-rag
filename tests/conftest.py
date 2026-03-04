import os
import tempfile

import pytest
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker

# Override settings BEFORE importing backend modules
_tmp_dir = tempfile.mkdtemp()
os.environ["DATABASE_URL"] = f"sqlite:///{_tmp_dir}/test.db"
os.environ["CHROMADB_DIR"] = os.path.join(_tmp_dir, "chromadb")
os.environ["ANTHROPIC_API_KEY"] = "test-key"

from backend.database import Base, get_db  # noqa: E402
from backend.main import app  # noqa: E402

_engine = create_engine(
    f"sqlite:///{_tmp_dir}/test.db",
    connect_args={"check_same_thread": False},
)


@event.listens_for(_engine, "connect")
def _enable_fk(dbapi_conn, connection_record):
    cursor = dbapi_conn.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


_TestSession = sessionmaker(bind=_engine)


@pytest.fixture(autouse=True)
def _setup_db():
    Base.metadata.create_all(bind=_engine)
    yield
    Base.metadata.drop_all(bind=_engine)


@pytest.fixture()
def db_session():
    session = _TestSession()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture()
def client(db_session):
    from httpx import ASGITransport, AsyncClient

    def _override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = _override_get_db

    transport = ASGITransport(app=app)
    client = AsyncClient(transport=transport, base_url="http://test")
    yield client
    app.dependency_overrides.clear()
