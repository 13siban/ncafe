import psycopg2
from psycopg2.extras import RealDictCursor
from app.config import DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD

def get_connection():
    return psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD
    )

def init_db():
    conn = get_connection()
    cur = conn.cursor()
    try:
        # Enable pgvector extension
        cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")
        
        # Create table for RAG documents
        cur.execute("""
            CREATE TABLE IF NOT EXISTS rag_documents (
                id SERIAL PRIMARY KEY,
                filename TEXT,
                content TEXT,
                embedding VECTOR(384),
                metadata JSONB,
                created_at TIMESTAMP DEFAULT NOW()
            );
        """)
        conn.commit()
    finally:
        cur.close()
        conn.close()

def execute_query(query, params=None, fetch=False):
    conn = get_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute(query, params)
        if fetch:
            result = cur.fetchall()
            return result
        conn.commit()
    finally:
        cur.close()
        conn.close()
