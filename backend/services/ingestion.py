import uuid
from pathlib import Path

import tiktoken
from PyPDF2 import PdfReader

from backend.config import settings
from backend.vector_store import vector_store

_enc = tiktoken.get_encoding("cl100k_base")


def extract_text(file_path: Path, content_type: str) -> str:
    if content_type == "application/pdf":
        reader = PdfReader(file_path)
        return "\n".join(page.extract_text() or "" for page in reader.pages)
    return file_path.read_text(encoding="utf-8")


def count_tokens(text: str) -> int:
    return len(_enc.encode(text))


def chunk_text(text: str) -> list[dict]:
    chunk_size = settings.chunk_size
    overlap = settings.chunk_overlap

    tokens = _enc.encode(text)
    chunks = []
    start = 0

    while start < len(tokens):
        end = start + chunk_size
        chunk_tokens = tokens[start:end]
        chunk_str = _enc.decode(chunk_tokens)

        # Map token positions back to approximate character positions
        start_char = len(_enc.decode(tokens[:start]))
        end_char = start_char + len(chunk_str)

        chunks.append(
            {
                "id": str(uuid.uuid4()),
                "text": chunk_str,
                "token_count": len(chunk_tokens),
                "chunk_index": len(chunks),
                "start_char": start_char,
                "end_char": end_char,
            }
        )

        if end >= len(tokens):
            break
        start = end - overlap

    return chunks


def ingest_document(
    db_session,
    document_id: str,
    filename: str,
    file_path: Path,
    content_type: str,
) -> None:
    from backend.models import Chunk, Document

    try:
        text = extract_text(file_path, content_type)
        chunks = chunk_text(text)

        # Store chunks in SQLite
        db_chunks = []
        for c in chunks:
            db_chunks.append(
                Chunk(
                    id=c["id"],
                    document_id=document_id,
                    chunk_index=c["chunk_index"],
                    text=c["text"],
                    token_count=c["token_count"],
                    start_char=c["start_char"],
                    end_char=c["end_char"],
                )
            )
        db_session.add_all(db_chunks)

        # Upsert into ChromaDB
        vector_store.add_chunks(
            ids=[c["id"] for c in chunks],
            texts=[c["text"] for c in chunks],
            metadatas=[
                {
                    "document_id": document_id,
                    "filename": filename,
                    "chunk_index": c["chunk_index"],
                    "token_count": c["token_count"],
                }
                for c in chunks
            ],
        )

        # Update document status
        doc = db_session.get(Document, document_id)
        doc.status = "ready"
        doc.chunk_count = len(chunks)
        db_session.commit()

    except Exception:
        db_session.rollback()
        doc = db_session.get(Document, document_id)
        if doc:
            doc.status = "error"
            db_session.commit()
        raise
