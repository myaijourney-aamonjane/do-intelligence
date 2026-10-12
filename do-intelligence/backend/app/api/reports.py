from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from ..core.db import get_db
from ..models import Comparison, Policy, ComparisonItem

router = APIRouter(prefix="/v1/reports", tags=["reports"])


@router.post("/comparison/{comparison_id}")
async def generate_comparison_report(
    comparison_id: int,
    db: Session = Depends(get_db),
):
    comparison = db.query(Comparison).filter(Comparison.id == comparison_id).first()
    if not comparison:
        raise HTTPException(status_code=404, detail="Comparison not found")
    
    # Get comparison items
    items = db.query(ComparisonItem).filter(ComparisonItem.comparison_id == comparison_id).all()
    
    # Get policy details
    policy_a = db.query(Policy).filter(Policy.id == comparison.policy_a_id).first()
    policy_b = db.query(Policy).filter(Policy.id == comparison.policy_b_id).first()
    
    high_risk_count = sum(1 for item in items if item.severity == "high")
    
    # Generate report structure
    report = {
        "report_id": comparison.id,
        "generated_at": datetime.now().isoformat(),
        "title": "D&O Intelligence - Comparative Report",
        "policies": {
            "policy_a": {
                "id": policy_a.id if policy_a else comparison.policy_a_id,
                "details": {
                    "policy_number": policy_a.policy_number if policy_a else "Apólice A",
                    "insurer": policy_a.insurer if policy_a else "N/A",
                    "liability_limit": policy_a.liability_limit if policy_a else "N/A",
                } if policy_a else None,
            },
            "policy_b": {
                "id": policy_b.id if policy_b else comparison.policy_b_id,
                "details": {
                    "policy_number": policy_b.policy_number if policy_b else "Apólice B",
                    "insurer": policy_b.insurer if policy_b else "N/A",
                    "liability_limit": policy_b.liability_limit if policy_b else "N/A",
                } if policy_b else None,
            },
        },
        "summary": comparison.summary or "Análise comparativa das apólices selecionadas",
        "comparison_items": [
            {
                "criterion": item.criterion,
                "value_a": item.value_a,
                "value_b": item.value_b,
                "difference": item.difference,
                "impact": item.impact,
                "severity": item.severity,
            }
            for item in items
        ],
        "points_of_attention": [
            f"Detectados {high_risk_count} pontos de atenção de alta severidade nesta análise.",
            "Recomenda-se verificação da cláusula de retroatividade para evitar lacuna de cobertura."
        ],
        "evidence": {
            "policy_a": [item.evidence_a for item in items if item.evidence_a],
            "policy_b": [item.evidence_b for item in items if item.evidence_b],
        },
        "limitations": "Esta análise é baseada em extração estruturada por IA. Para parecer jurídico definitivo, consulte o departamento de compliance.",
    }
    
    return report