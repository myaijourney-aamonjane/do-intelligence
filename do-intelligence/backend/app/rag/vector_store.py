import uuid
from typing import List, Dict, Any, Optional

class VectorStore:
    """
    Vector store manager using ChromaDB with an in-memory cosine fallback
    for document chunk retrieval and evidence grounding.
    """
    def __init__(self, collection_name: str = "do_policies"):
        self.collection_name = collection_name
        self.use_chroma = False
        self._in_memory_store: List[Dict[str, Any]] = []

        try:
            import chromadb
            self.chroma_client = chromadb.Client()
            self.collection = self.chroma_client.get_or_create_collection(name=collection_name)
            self.use_chroma = True
        except Exception:
            self.use_chroma = False

    def add_chunks(self, chunks: List[Dict[str, Any]], document_id: str):
        """Add text chunks to vector store with metadata."""
        if not chunks:
            return

        documents = []
        metadatas = []
        ids = []

        for idx, chunk in enumerate(chunks):
            chunk_id = chunk.get("chunk_id") or f"{document_id}_chunk_{idx}_{uuid.uuid4().hex[:8]}"
            text = chunk.get("text", "")
            page = chunk.get("page", 1)

            documents.append(text)
            meta = {
                "document_id": str(document_id),
                "page": int(page),
                "source": chunk.get("source", ""),
                "start": chunk.get("start", 0),
                "end": chunk.get("end", 0),
            }
            metadatas.append(meta)
            ids.append(chunk_id)

            self._in_memory_store.append({
                "id": chunk_id,
                "text": text,
                "metadata": meta
            })

        if self.use_chroma and documents:
            try:
                self.collection.add(
                    documents=documents,
                    metadatas=metadatas,
                    ids=ids
                )
            except Exception:
                pass

    def search(self, query: str, document_id: Optional[str] = None, limit: int = 5) -> List[Dict[str, Any]]:
        """Search for relevant chunks using ChromaDB or fallback keyword matching."""
        if self.use_chroma:
            try:
                where_clause = {"document_id": str(document_id)} if document_id else None
                results = self.collection.query(
                    query_texts=[query],
                    n_results=limit,
                    where=where_clause
                )
                retrieved = []
                if results and results.get("documents") and results["documents"][0]:
                    for i in range(len(results["documents"][0])):
                        retrieved.append({
                            "id": results["ids"][0][i],
                            "text": results["documents"][0][i],
                            "metadata": results["metadatas"][0][i] if results.get("metadatas") else {},
                            "distance": results["distances"][0][i] if results.get("distances") else 0.0
                        })
                    return retrieved
            except Exception:
                pass

        # In-memory keyword/overlap fallback search
        query_words = set(query.lower().split())
        scored_results = []
        for item in self._in_memory_store:
            if document_id and item["metadata"].get("document_id") != str(document_id):
                continue
            text_words = set(item["text"].lower().split())
            overlap = len(query_words.intersection(text_words))
            scored_results.append((overlap, item))

        scored_results.sort(key=lambda x: x[0], reverse=True)
        return [item for _, item in scored_results[:limit]]
