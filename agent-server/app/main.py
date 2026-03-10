from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import chat, vector
from app.services.database import init_db

app = FastAPI(title="AI Chat & RAG Server")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    # Database initialization
    init_db()
    # E5 model is loaded when first accessed, or we could load it here to pre-fetch
    # from app.services.vector import get_vector_service
    # get_vector_service()

app.include_router(chat.router)
app.include_router(vector.router)

@app.get("/health")
def health():
    return {"status": "ok"}
