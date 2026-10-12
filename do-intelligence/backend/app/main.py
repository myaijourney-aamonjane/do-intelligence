import os
import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Ensure backend directory is in sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.core.config import engine, Base
import app.models  # Register SQLAlchemy models with Base metadata
from app.api.endpoints import router as api_router
from app.api.auth import router as auth_router
from app.api.documents import router as documents_router
from app.api.policies import router as policies_router
from app.api.comparisons import router as comparisons_router
from app.api.reports import router as reports_router

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="D&O Intelligence API",
    description="API for D&O Intelligence - Intelligent policy analysis and comparison",
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
app.include_router(auth_router)
app.include_router(documents_router)
app.include_router(policies_router)
app.include_router(comparisons_router)
app.include_router(reports_router)
