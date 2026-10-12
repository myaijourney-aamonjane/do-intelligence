from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..core.db import get_db
from ..models import Policy, Comparison, ComparisonItem

router = APIRouter(prefix="/v1/comparisons", tags=["comparisons"])


@router.post("", status_code=201)
async def create_comparison(
    policy_a_id: int,
    policy_b_id: int,
    db: Session = Depends(get_db),
):
    # Validate that both policies exist
    policy_a = db.query(Policy).filter(Policy.id == policy_a_id).first()
    policy_b = db.query(Policy).filter(Policy.id == policy_b_id).first()
    
    if not policy_a:
        raise HTTPException(status_code=404, detail="Policy A not found")
    if not policy_b:
        raise HTTPException(status_code=404, detail="Policy B not found")
    
    # Create comparison
    comparison = Comparison(
        policy_a_id=policy_a_id,
        policy_b_id=policy_b_id,
        summary=f"Comparação entre Apólice #{policy_a.policy_number} e #{policy_b.policy_number}"
    )
    db.add(comparison)
    db.commit()
    db.refresh(comparison)
    
    # Generate criteria items
    criteria_definitions = [
        ("Limite de Responsabilidade", policy_a.liability_limit, policy_b.liability_limit, "Apólice B apresenta limite compatível", "low"),
        ("Limite Agregado", policy_a.aggregate_limit, policy_b.aggregate_limit, "Limites equivalentes", "low"),
        ("Franquia / Retenção", policy_a.deductible, policy_b.deductible, "Diferença em retenção inicial", "medium"),
        ("Retroatividade", policy_a.retroactivity, policy_b.retroactivity, "Cobertura para atos anteriores", "high"),
        ("Período de Reporte", policy_a.reporting_period, policy_b.reporting_period, "Prazo estendido para notificação", "medium"),
        ("Jurisdição", policy_a.jurisdiction, policy_b.jurisdiction, "Fórum e jurisdição aplicável", "high"),
    ]

    generated_items = []
    for crit, val_a, val_b, impact, sev in criteria_definitions:
        val_a_str = str(val_a) if val_a else "Não especificado"
        val_b_str = str(val_b) if val_b else "Não especificado"
        diff = f"{val_a_str} vs {val_b_str}"
        
        item = ComparisonItem(
            comparison_id=comparison.id,
            criterion=crit,
            value_a=val_a_str,
            value_b=val_b_str,
            difference=diff,
            impact=impact,
            severity=sev,
            evidence_a={"evidence": f"Página 1: {crit} = {val_a_str}"},
            evidence_b={"evidence": f"Página 1: {crit} = {val_b_str}"},
        )
        db.add(item)
        generated_items.append(item)

    db.commit()
    
    return {
        "id": comparison.id,
        "policy_a_id": policy_a_id,
        "policy_b_id": policy_b_id,
        "summary": comparison.summary,
        "items": [
            {
                "criterion": item.criterion,
                "value_a": item.value_a,
                "value_b": item.value_b,
                "difference": item.difference,
                "impact": item.impact,
                "severity": item.severity
            }
            for item in generated_items
        ],
        "message": "Comparison created successfully",
    }


@router.get("")
async def list_comparisons(db: Session = Depends(get_db)):
    comparisons = db.query(Comparison).all()
    return comparisons


@router.get("/{comparison_id}")
async def get_comparison(comparison_id: int, db: Session = Depends(get_db)):
    comparison = db.query(Comparison).filter(Comparison.id == comparison_id).first()
    if not comparison:
        raise HTTPException(status_code=404, detail="Comparison not found")
    
    # Get comparison items
    items = db.query(ComparisonItem).filter(ComparisonItem.comparison_id == comparison_id).all()
    
    # Get policy details
    policy_a = db.query(Policy).filter(Policy.id == comparison.policy_a_id).first()
    policy_b = db.query(Policy).filter(Policy.id == comparison.policy_b_id).first()
    
    return {
        "id": comparison.id,
        "policy_a_id": comparison.policy_a_id,
        "policy_b_id": comparison.policy_b_id,
        "summary": comparison.summary,
        "items": [
            {
                "id": item.id,
                "criterion": item.criterion,
                "value_a": item.value_a,
                "value_b": item.value_b,
                "difference": item.difference,
                "impact": item.impact,
                "severity": item.severity,
                "evidence_a": item.evidence_a,
                "evidence_b": item.evidence_b,
            }
            for item in items
        ],
        "policy_a_details": {
            "id": policy_a.id,
            "policy_number": policy_a.policy_number,
        } if policy_a else None,
        "policy_b_details": {
            "id": policy_b.id,
            "policy_number": policy_b.policy_number,
        } if policy_b else None,
    }