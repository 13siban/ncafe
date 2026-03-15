from pydantic import BaseModel
from typing import List, Optional, Any
from datetime import datetime

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]
    stream: bool = True
    userId: Optional[str] = None
    cartSummary: Optional[str] = None

class IngestRequest(BaseModel):
    filename: str
    content: str
    metadata: Optional[dict] = None

class SearchRequest(BaseModel):
    query: str
    limit: int = 5
    threshold: float = 0.5

class DocumentResponse(BaseModel):
    id: int
    filename: str
    content: str
    metadata: Optional[Any] = None
    created_at: datetime
    similarity: Optional[float] = None
