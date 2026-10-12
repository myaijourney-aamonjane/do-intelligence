import os
import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from pdf2image import convert_from_path
import pytesseract

from sqlalchemy.orm import Session

from ..core.db import get_db
from ..models import Document, Checkpoint, User


class DocumentAgent:
    """Agente responsável por receber documento, validar formato, armazenar e preparar para processamento."""

    @staticmethod
    def upload_document(file_path: str, filename: str, mime_type: str, db: Session) -> Dict[str, Any]:
        """Processa o upload de um documento e cria registro no banco."""
        # Determine page count and text extraction method
        page_count = DocumentAgent._count_pages(file_path)
        has_text = DocumentAgent._has_embeded_text(file_path)

        # Create document record
        document = Document(
            filename=filename,
            file_path=file_path,
            mime_type=mime_type,
            page_count=page_count,
            status="UPLOADED",
        )
        db.add(document)
        db.commit()
        db.refresh(document)

        # Create checkpoint for resumability
        checkpoint = Checkpoint(
            chave_ctx=f"doc_{document.id}",
            tipo="document_upload",
            estado={"pages": page_count, "has_text": has_text},
            passo="initial_upload",
            criado_em=datetime.now(timezone.utc),
            atualizado_em=datetime.now(timezone.utc),
        )
        db.add(checkpoint)
        db.commit()

        return {
            "id": document.id,
            "filename": document.filename,
            "file_path": document.file_path,
            "mime_type": document.mime_type,
            "page_count": document.page_count,
            "status": document.status,
            "has_text": has_text,
        }

    @staticmethod
    def _count_pages(file_path: str) -> Optional[int]:
        """Conta o número de páginas do PDF."""
        try:
            if file_path.lower().endswith('.pdf'):
                from pdf2image import pdf_info_dict
                import fitz  # PyMuPDF
                doc = fitz.open(file_path)
                return len(doc)
            return 1
        except Exception:
            return 1

    @staticmethod
    def _has_embeded_text(file_path: str) -> bool:
        """Verifica se o PDF tem texto embutido ou precisa de OCR."""
        try:
            import fitz
            doc = fitz.open(file_path)
            for page in doc:
                text = page.get_text("text")
                if text.strip():
                    return True
            return False
        except Exception:
            return False

    @staticmethod
    def extract_text(file_path: str, page_numbers: Optional[List[int]] = None) -> Dict[str, Any]:
        """Extrai texto de um documento usando PyMuPDF ou Tesseract OCR."""
        try:
            file_path = os.path.abspath(file_path)
            if not os.path.exists(file_path):
                return {
                    "success": False,
                    "error": f"Ficheiro não encontrado: {file_path}",
                    "pages_processed": 0,
                    "text_by_page": [],
                }

            lower_path = file_path.lower()
            is_image = lower_path.endswith(('.png', '.jpg', '.jpeg'))

            results = []

            # Se for imagem direta (PNG/JPG)
            if is_image:
                ocr_text = ""
                try:
                    from PIL import Image
                    img = Image.open(file_path)
                    ocr_text = pytesseract.image_to_string(img)
                except Exception as img_err:
                    ocr_text = ""
                
                results.append({
                    "page": 1,
                    "text": ocr_text.strip(),
                    "source": file_path,
                })
                return {
                    "success": True,
                    "pages_processed": 1,
                    "text_by_page": results,
                }

            # Se for documento PDF
            import fitz
            doc = fitz.open(file_path)

            pages_to_process = page_numbers or list(range(len(doc)))

            for page_num in pages_to_process:
                page = doc[page_num]
                text = page.get_text("text")

                # Se não encontrar texto embutido, tenta OCR com tratamento defensivo
                if not text.strip():
                    try:
                        from pdf2image import convert_from_path
                        images = convert_from_path(file_path, first_page=page_num + 1, last_page=page_num + 1)
                        if images:
                            img = images[0]
                            import io
                            buf = io.BytesIO()
                            img.save(buf, format='PNG')
                            buf.seek(0)
                            text = pytesseract.image_to_string(buf)
                    except Exception:
                        # Fallback silencioso caso poppler ou tesseract não estejam disponíveis
                        text = ""

                results.append({
                    "page": page_num + 1,
                    "text": text.strip(),
                    "source": file_path,
                })

            return {
                "success": True,
                "pages_processed": len(results),
                "text_by_page": results,
            }

        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "pages_processed": 0,
                "text_by_page": [],
            }

    @staticmethod
    def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> List[Dict[str, Any]]:
        """Divide o texto em chunks para RAG."""
        chunks = []
        start = 0

        while start < len(text):
            end = start + chunk_size
            chunk_text = text[start:end]
            chunk_id = str(uuid.uuid4())

            chunks.append({
                "chunk_id": chunk_id,
                "text": chunk_text,
                "start": start,
                "end": end,
                "character_count": len(chunk_text),
            })

            start = end - overlap if end - overlap > start else end

        return chunks