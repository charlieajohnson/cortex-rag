from backend.services.retrieval import retrieve_chunks
from backend.vector_store import vector_store


def test_retrieve_returns_ranked_results():
    vector_store.add_chunks(
        ids=["r1", "r2", "r3"],
        texts=[
            "Python is a programming language",
            "FastAPI is a web framework built on Python",
            "Chocolate cake is delicious",
        ],
        metadatas=[
            {"document_id": "d1", "filename": "a.txt", "chunk_index": 0, "token_count": 5},
            {"document_id": "d1", "filename": "a.txt", "chunk_index": 1, "token_count": 7},
            {"document_id": "d2", "filename": "b.txt", "chunk_index": 0, "token_count": 4},
        ],
    )

    results = retrieve_chunks("what is FastAPI?", top_k=3)
    assert len(results) == 3
    # FastAPI chunk should rank highest
    assert results[0]["id"] == "r2"
    assert results[0]["score"] > results[2]["score"]

    # Clean up
    vector_store.delete_by_document_id("d1")
    vector_store.delete_by_document_id("d2")


def test_retrieve_filters_by_document_id():
    vector_store.add_chunks(
        ids=["f1", "f2"],
        texts=["Python info", "Python info duplicate"],
        metadatas=[
            {"document_id": "doc-a", "filename": "a.txt", "chunk_index": 0, "token_count": 2},
            {"document_id": "doc-b", "filename": "b.txt", "chunk_index": 0, "token_count": 2},
        ],
    )

    results = retrieve_chunks("Python", top_k=5, document_ids=["doc-a"])
    assert len(results) == 1
    assert results[0]["metadata"]["document_id"] == "doc-a"

    # Clean up
    vector_store.delete_by_document_id("doc-a")
    vector_store.delete_by_document_id("doc-b")
