import chromadb

from backend.config import settings


class VectorStore:
    def __init__(self):
        self._client = chromadb.PersistentClient(path=settings.chromadb_dir)
        self._collection = self._client.get_or_create_collection(
            name=settings.chromadb_collection,
            metadata={"hnsw:space": "cosine"},
        )

    def add_chunks(
        self,
        ids: list[str],
        texts: list[str],
        metadatas: list[dict],
    ) -> None:
        self._collection.add(
            ids=ids,
            documents=texts,
            metadatas=metadatas,
        )

    def query(
        self,
        query_text: str,
        top_k: int = 5,
        where: dict | None = None,
    ) -> list[dict]:
        kwargs: dict = {
            "query_texts": [query_text],
            "n_results": top_k,
        }
        if where:
            kwargs["where"] = where

        results = self._collection.query(**kwargs)

        chunks = []
        for i in range(len(results["ids"][0])):
            chunks.append(
                {
                    "id": results["ids"][0][i],
                    "text": results["documents"][0][i],
                    "score": 1 - results["distances"][0][i],  # cosine: distance → similarity
                    "metadata": results["metadatas"][0][i],
                }
            )
        return chunks

    def delete_by_document_id(self, document_id: str) -> None:
        self._collection.delete(where={"document_id": document_id})


vector_store = VectorStore()
