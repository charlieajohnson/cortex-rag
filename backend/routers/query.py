import json
import time

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.config import settings
from backend.database import get_db
from backend.models import Query
from backend.schemas import QueryIn, QueryOut, SourceOut
from backend.services.generation import generate_answer
from backend.services.retrieval import retrieve_chunks

router = APIRouter(tags=["query"])


@router.post("/query", response_model=QueryOut)
def query_documents(body: QueryIn, db: Session = Depends(get_db)):
    start = time.perf_counter()

    chunks = retrieve_chunks(
        question=body.question,
        top_k=body.top_k,
        document_ids=body.document_ids,
    )

    answer = generate_answer(body.question, chunks, mode=body.mode)

    latency_ms = int((time.perf_counter() - start) * 1000)

    sources = [
        SourceOut(
            chunk_id=c["id"],
            document_id=c["metadata"]["document_id"],
            filename=c["metadata"]["filename"],
            chunk_index=c["metadata"]["chunk_index"],
            text=c["text"][:200],
            score=round(c["score"], 4),
        )
        for c in chunks
    ]

    # Log query for analytics
    query_log = Query(
        question=body.question,
        answer=answer,
        source_chunks=json.dumps([s.chunk_id for s in sources]),
        model=settings.anthropic_model,
        latency_ms=latency_ms,
    )
    db.add(query_log)
    db.commit()

    return QueryOut(
        answer=answer,
        sources=sources,
        model=settings.anthropic_model,
        latency_ms=latency_ms,
        mode=body.mode,
    )
