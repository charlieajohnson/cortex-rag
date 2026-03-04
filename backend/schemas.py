from datetime import datetime

from pydantic import BaseModel


# --- Documents ---

class DocumentOut(BaseModel):
    id: str
    filename: str
    status: str
    chunk_count: int
    created_at: datetime

    model_config = {"from_attributes": True}


class DocumentListOut(BaseModel):
    documents: list[DocumentOut]


# --- Query ---

class QueryIn(BaseModel):
    question: str
    document_ids: list[str] | None = None
    top_k: int = 5


class SourceOut(BaseModel):
    chunk_id: str
    document_id: str
    filename: str
    chunk_index: int
    text: str
    score: float


class QueryOut(BaseModel):
    answer: str
    sources: list[SourceOut]
    model: str
    latency_ms: int
