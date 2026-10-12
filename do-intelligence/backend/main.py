#!/usr/bin/env python3
"""D&O Intelligence - FastAPI Application Entry Point."""
import os
import sys

# Ensure the backend directory is on sys.path so 'app.*' imports resolve
_backend_dir = os.path.dirname(os.path.abspath(__file__))
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import engine, Base
import app.models  # Register SQLAlchemy models with Base metadata
from app.api.endpoints import router as api_router
from app.api.auth import router as auth_router
from app.api.documents import router as documents_router
from app.api.policies import router as policies_router
from app.api.comparisons import router as comparisons_router
from app.api.reports import router as reports_router

# Create all database tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="D&O Intelligence API",
    description="Intelligent analysis and comparison of D&O insurance policies.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)
app.include_router(documents_router)
app.include_router(policies_router)
app.include_router(comparisons_router)
app.include_router(reports_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
