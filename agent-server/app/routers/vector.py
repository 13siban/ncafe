from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.services.vector import get_vector_service, VectorService
from app.models.schemas import IngestRequest, SearchRequest, DocumentResponse, UpdateRequest

router = APIRouter(prefix="/api/vector", tags=["Vector Management"])

@router.post("/ingest")
async def ingest_document(request: IngestRequest, service: VectorService = Depends(get_vector_service)):
    try:
        doc_id = service.ingest_document(request.filename, request.content, request.metadata)
        return {"id": doc_id, "message": "Document ingested successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/search", response_model=List[DocumentResponse])
async def search_similar(request: SearchRequest, service: VectorService = Depends(get_vector_service)):
    try:
        results = service.search_similar(request.query, request.limit, request.threshold)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/documents")
async def list_documents(service: VectorService = Depends(get_vector_service)):
    try:
        results = service.list_documents()
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/documents/{doc_id}")
async def delete_document(doc_id: int, service: VectorService = Depends(get_vector_service)):
    try:
        service.delete_document(doc_id)
        return {"message": f"Document {doc_id} deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/documents/{doc_id}")
async def update_document(doc_id: int, request: UpdateRequest, service: VectorService = Depends(get_vector_service)):
    try:
        service.update_document(doc_id, request.filename, request.content, request.metadata)
        return {"message": f"Document {doc_id} updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
