import json
import numpy as np
from sentence_transformers import SentenceTransformer
from app.services.database import get_connection
from psycopg2.extras import RealDictCursor

class VectorService:
    def __init__(self, model_name="intfloat/multilingual-e5-small"):
        # CPU is used based on your request
        self.model = SentenceTransformer(model_name, device="cpu")
        print(f"Loaded embedding model: {model_name}")

    def embed_text(self, text, prefix="passage: "):
        # e5 models require 'passage: ' or 'query: ' prefix
        prefixed_text = f"{prefix}{text}"
        embedding = self.model.encode(prefixed_text)
        return embedding.tolist()

    def ingest_document(self, filename, content, metadata=None):
        embedding = self.embed_text(content, prefix="passage: ")
        
        conn = get_connection()
        cur = conn.cursor()
        try:
            cur.execute("""
                INSERT INTO rag_documents (filename, content, embedding, metadata)
                VALUES (%s, %s, %s, %s)
                RETURNING id;
            """, (filename, content, embedding, json.dumps(metadata) if metadata else None))
            doc_id = cur.fetchone()[0]
            conn.commit()
            return doc_id
        finally:
            cur.close()
            conn.close()

    def search_similar(self, query, limit=5, threshold=0.5):
        query_embedding = self.embed_text(query, prefix="query: ")
        
        conn = get_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        try:
            # Using cosine distance (1 - similarity), 3rd param is threshold
            # pgvector operators: <=> (cosine distance), <#> (inner product), <-> (L2 distance)
            # cosine distance = 1 - cosine similarity
            # similarity = 1 - (embedding <=> query_embedding)
            cur.execute("""
                SELECT id, filename, content, metadata, created_at,
                       (1 - (embedding <=> %s::vector)) as similarity
                FROM rag_documents
                WHERE (1 - (embedding <=> %s::vector)) > %s
                ORDER BY similarity DESC
                LIMIT %s;
            """, (query_embedding, query_embedding, threshold, limit))
            results = cur.fetchall()
            return results
        finally:
            cur.close()
            conn.close()

    def list_documents(self):
        conn = get_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        try:
            cur.execute("SELECT id, filename, content, metadata, created_at FROM rag_documents ORDER BY created_at DESC;")
            return cur.fetchall()
        finally:
            cur.close()
            conn.close()

    def delete_document(self, doc_id):
        conn = get_connection()
        cur = conn.cursor()
        try:
            cur.execute("DELETE FROM rag_documents WHERE id = %s;", (doc_id,))
            conn.commit()
        finally:
            cur.close()
            conn.close()

# Initialize as a singleton if needed
_vector_service = None

def get_vector_service():
    global _vector_service
    if _vector_service is None:
        _vector_service = VectorService()
    return _vector_service
