import os, sys

sys_path = r'd:\Projectos\I2A2\Labs\DO Insight — Intelligent Policy Analysis\do-intelligence\backend'
os.chdir(sys_path)
sys.path.insert(0, sys_path)

from app.core.config import SessionLocal
from app.models import Document
from app.agents.orchestrator import OrchestratorPipeline

def test_pipeline():
    db = SessionLocal()
    try:
        # Create or fetch a test document
        doc = db.query(Document).first()
        if not doc:
            doc = Document(filename="POL-DO-TESTE.pdf", file_path="POL-DO-TESTE.pdf", mime_type="application/pdf", file_size=1024)
            db.add(doc)
            db.commit()
            db.refresh(doc)
        
        print(f"Testing pipeline for document ID: {doc.id}, Filename: {doc.filename}")
        pipeline = OrchestratorPipeline(db)
        state = pipeline.run_pipeline(doc.id)
        
        print("Pipeline Execution Result:")
        print("  Status:", state.get("processing_status"))
        print("  Policy ID:", state.get("policy_id"))
        print("  Errors:", state.get("errors"))
        
        assert state.get("processing_status") == "COMPLETED", "Pipeline status should be COMPLETED"
        assert state.get("policy_id") is not None, "Policy ID should not be None"
        print("SUCCESS! Pipeline executed without errors.")
    finally:
        db.close()

if __name__ == "__main__":
    test_pipeline()
