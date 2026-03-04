from backend.vector_store import vector_store


def retrieve_chunks(
    question: str,
    top_k: int = 5,
    document_ids: list[str] | None = None,
) -> list[dict]:
    where = None
    if document_ids:
        if len(document_ids) == 1:
            where = {"document_id": document_ids[0]}
        else:
            where = {"document_id": {"$in": document_ids}}

    results = vector_store.query(query_text=question, top_k=top_k, where=where)
    return results
