from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..core.db import get_db
from ..models import User, AuditLog, Setting, Checkpoint, Document, Policy

router = APIRouter(prefix="/api", tags=["api"])


@router.get("/health")
async def health_check():
    return {"status": "healthy", "message": "D&O Intelligence API is running"}


@router.get("/logs")
async def list_audit_logs(db: Session = Depends(get_db)):
    logs = db.query(AuditLog).order_by(AuditLog.data.desc()).all()
    result = []
    for log in logs:
        # Determine level based on action or default to INFO
        level = "INFO"
        if "FAIL" in log.action or "ERROR" in log.action:
            level = "ERROR"
        elif "RISK" in log.action or "WARN" in log.action:
            level = "WARNING"
        elif "UPLOAD" in log.action or "EXTRACTION" in log.action or "CLASSIFICATION" in log.action:
            level = "SUCCESS"

        result.append({
            "id": log.id,
            "timestamp": log.data.isoformat() if log.data else None,
            "action": log.action,
            "user": log.user.full_name if log.user else "Sistema",
            "level": level,
            "details": f"{log.entity}: {log.dados_depois or log.dados_antes or 'Operação registrada com sucesso.'}"
            if isinstance(log.dados_depois, str) or isinstance(log.dados_antes, str)
            else (log.dados_depois.get("msg") if isinstance(log.dados_depois, dict) else f"Ação {log.action} executada na entidade {log.entity} #{log.entity_id or ''}."),
        })
    return result


@router.get("/settings")
async def get_settings(db: Session = Depends(get_db)):
    settings = db.query(Setting).all()
    if not settings:
        return [
            {"key": "LLM_PROVIDER", "value": "MockLLMProvider", "description": "Provedor ativo para extração de cláusulas"},
            {"key": "MODEL_NAME", "value": "google/gemini-2.5-flash", "description": "Modelo OpenRouter configurado"},
            {"key": "OCR_ENGINE", "value": "PyMuPDF + Tesseract OCR", "description": "Motor de extração de texto"},
            {"key": "VECTOR_STORE", "value": "ChromaDB + In-Memory Fallback", "description": "Índice vetorial RAG"}
        ]
    return settings


@router.get("/")
async def root():
    return {"message": "D&O Intelligence API v1.0"}