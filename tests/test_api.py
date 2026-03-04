import io
from unittest.mock import patch

import pytest


@pytest.mark.asyncio
async def test_upload_and_list(client):
    content = b"FastAPI is a modern web framework for Python."
    response = await client.post(
        "/documents",
        files={"file": ("test.txt", io.BytesIO(content), "text/plain")},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["filename"] == "test.txt"
    assert data["status"] == "processing"

    # List should include the document
    list_resp = await client.get("/documents")
    assert list_resp.status_code == 200
    docs = list_resp.json()["documents"]
    assert len(docs) == 1
    assert docs[0]["id"] == data["id"]


@pytest.mark.asyncio
async def test_upload_bad_type(client):
    response = await client.post(
        "/documents",
        files={"file": ("image.png", io.BytesIO(b"fake"), "image/png")},
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_delete_not_found(client):
    response = await client.delete("/documents/nonexistent-id")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_query_endpoint(client, db_session):
    """Test the full query flow with a mocked Anthropic API."""
    from backend.models import Chunk, Document
    from backend.vector_store import vector_store

    # Seed a document + chunk directly
    doc = Document(
        id="q-doc-1",
        filename="query_test.txt",
        content_type="text/plain",
        size_bytes=100,
        status="ready",
        chunk_count=1,
    )
    db_session.add(doc)
    chunk = Chunk(
        id="q-chunk-1",
        document_id="q-doc-1",
        chunk_index=0,
        text="FastAPI provides automatic request validation using Pydantic models.",
        token_count=10,
    )
    db_session.add(chunk)
    db_session.commit()

    vector_store.add_chunks(
        ids=["q-chunk-1"],
        texts=["FastAPI provides automatic request validation using Pydantic models."],
        metadatas=[
            {
                "document_id": "q-doc-1",
                "filename": "query_test.txt",
                "chunk_index": 0,
                "token_count": 10,
            }
        ],
    )

    mock_response = type("Resp", (), {
        "content": [type("Block", (), {"text": "FastAPI validates requests automatically [Source 1]."})()]
    })()

    with patch("backend.services.generation._client") as mock_client:
        mock_client.messages.create.return_value = mock_response

        resp = await client.post(
            "/query",
            json={"question": "How does FastAPI validate requests?"},
        )

    assert resp.status_code == 200
    data = resp.json()
    assert "FastAPI" in data["answer"]
    assert len(data["sources"]) >= 1
    assert data["sources"][0]["filename"] == "query_test.txt"
    assert data["latency_ms"] >= 0

    # Clean up
    vector_store.delete_by_document_id("q-doc-1")
