import tempfile
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, UploadFile
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import Document
from backend.schemas import DocumentListOut, DocumentOut
from backend.services.ingestion import ingest_document
from backend.vector_store import vector_store

router = APIRouter(prefix="/documents", tags=["documents"])

ALLOWED_TYPES = {
    "application/pdf": ".pdf",
    "text/plain": ".txt",
    "text/markdown": ".md",
}


def _run_ingestion(document_id: str, filename: str, file_path: Path, content_type: str):
    from backend.database import SessionLocal

    db = SessionLocal()
    try:
        ingest_document(db, document_id, filename, file_path, content_type)
    finally:
        db.close()
        file_path.unlink(missing_ok=True)


@router.post("", response_model=DocumentOut, status_code=201)
async def upload_document(
    file: UploadFile,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    content_type = file.content_type or ""

    # Also allow by extension for clients that don't set content_type correctly
    ext = Path(file.filename or "").suffix.lower()
    if content_type not in ALLOWED_TYPES:
        ext_to_type = {v: k for k, v in ALLOWED_TYPES.items()}
        if ext in ext_to_type:
            content_type = ext_to_type[ext]
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type. Allowed: PDF, TXT, MD",
            )

    # Save uploaded file to temp location
    contents = await file.read()
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=ext)
    tmp.write(contents)
    tmp.close()
    tmp_path = Path(tmp.name)

    doc = Document(
        filename=file.filename or "untitled",
        content_type=content_type,
        size_bytes=len(contents),
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    background_tasks.add_task(_run_ingestion, doc.id, doc.filename, tmp_path, content_type)

    return doc


@router.get("", response_model=DocumentListOut)
def list_documents(db: Session = Depends(get_db)):
    docs = db.query(Document).order_by(Document.created_at.desc()).all()
    return DocumentListOut(documents=docs)


@router.delete("/{document_id}", status_code=204)
def delete_document(document_id: str, db: Session = Depends(get_db)):
    doc = db.get(Document, document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Delete from ChromaDB first (orphaned SQLite rows are safer than orphaned vectors)
    vector_store.delete_by_document_id(document_id)

    # Cascade deletes chunks in SQLite
    db.delete(doc)
    db.commit()
