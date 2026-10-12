from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..core.db import get_db
from ..core.config import UPLOAD_DIR
from ..models import Document, User
from ..agents.orchestrator import OrchestratorPipeline
import os
import uuid

router = APIRouter(prefix="/v1/documents", tags=["documents"])


@router.get("")
async def list_documents(db: Session = Depends(get_db)):
    documents = db.query(Document).order_by(Document.id.desc()).all()
    return documents


@router.get("/{document_id}")
async def get_document(document_id: int, db: Session = Depends(get_db)):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return document


@router.post("/upload", status_code=201)
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    # Validate file type and extension
    file_extension = os.path.splitext(file.filename or "")[1].lower()
    allowed_extensions = [".pdf", ".png", ".jpg", ".jpeg"]
    allowed_types = [
        "application/pdf",
        "application/x-pdf",
        "application/octet-stream",
        "image/png",
        "image/jpeg",
        "image/jpg",
        "image/pjpeg",
    ]

    is_valid = (file_extension in allowed_extensions) or (file.content_type in allowed_types)
    if not is_valid or file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Formato não suportado ({file.filename}). Por favor envie arquivos PDF ou Imagens (PNG/JPG).",
        )
    
    # Generate safe filename and absolute file path
    safe_filename = f"{uuid.uuid4()}{file_extension}"
    upload_dir_path = str(UPLOAD_DIR)
    os.makedirs(upload_dir_path, exist_ok=True)
    file_path = os.path.join(upload_dir_path, safe_filename)
    
    # Save file
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)
    
    # Normalize MIME type if generic
    effective_mime = file.content_type
    if not effective_mime or effective_mime == "application/octet-stream":
        if file_extension == ".pdf":
            effective_mime = "application/pdf"
        elif file_extension == ".png":
            effective_mime = "image/png"
        elif file_extension in [".jpg", ".jpeg"]:
            effective_mime = "image/jpeg"

    # Create document record
    document = Document(
        filename=file.filename,
        file_path=file_path,
        mime_type=effective_mime or "application/pdf",
        status="UPLOADED",
    )
    db.add(document)
    db.commit()
    db.refresh(document)
    
    return {
        "id": document.id,
        "filename": document.filename,
        "safe_filename": safe_filename,
        "file_path": file_path,
        "mime_type": document.mime_type,
        "status": document.status,
    }


@router.post("/{document_id}/process")
async def process_document(
    document_id: int,
    db: Session = Depends(get_db),
):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    pipeline = OrchestratorPipeline(db)
    result_state = pipeline.run_pipeline(document_id)
    status_result = result_state.get("processing_status")

    if status_result == "FAILED":
        errors = result_state.get("errors") or []
        error_msg = "; ".join(errors) if errors else "Falha no processamento da apólice pelo agente de IA."
        return {
            "id": document.id,
            "status": "FAILED",
            "policy_id": None,
            "error": error_msg,
            "message": error_msg,
        }
    
    return {
        "id": document.id,
        "status": status_result,
        "policy_id": result_state.get("policy_id"),
        "message": "Document processing completed",
    }


@router.get("/{document_id}/status")
async def document_status(document_id: int, db: Session = Depends(get_db)):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"id": document.id, "status": document.status}