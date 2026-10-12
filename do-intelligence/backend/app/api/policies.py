from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..core.db import get_db
from ..models import Policy, Document, PolicyField, Clause

router = APIRouter(prefix="/v1/policies", tags=["policies"])


@router.get("")
async def list_policies(db: Session = Depends(get_db)):
    policies = db.query(Policy).all()
    return policies


@router.get("/{policy_id}")
async def get_policy(policy_id: int, db: Session = Depends(get_db)):
    policy = db.query(Policy).filter(Policy.id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    return policy


@router.get("/{policy_id}/fields")
async def get_policy_fields(policy_id: int, db: Session = Depends(get_db)):
    fields = db.query(PolicyField).filter(PolicyField.policy_id == policy_id).all()
    return fields


@router.get("/{policy_id}/clauses")
async def get_policy_clauses(policy_id: int, db: Session = Depends(get_db)):
    clauses = db.query(Clause).filter(Clause.policy_id == policy_id).all()
    return clauses


@router.get("/{policy_id}/evidence")
async def get_policy_evidence(policy_id: int, db: Session = Depends(get_db)):
    fields = db.query(PolicyField).filter(PolicyField.policy_id == policy_id).all()
    clauses = db.query(Clause).filter(Clause.policy_id == policy_id).all()

    policy = db.query(Policy).filter(Policy.id == policy_id).first()
    policy_name = policy.policy_number if policy else f"Apólice #{policy_id}"

    evidence = []
    for field in fields:
        if field.evidence:
            evidence.append({
                "source": "field",
                "policy_id": field.policy_id,
                "policy_name": policy_name,
                "field_name": field.field_name,
                "evidence": field.evidence,
                "page": field.page or 1,
                "value": field.value,
                "confidence": field.confidence or 0.94,
            })

    for clause in clauses:
        if clause.evidence:
            evidence.append({
                "source": "clause",
                "policy_id": clause.policy_id,
                "policy_name": policy_name,
                "clause_name": clause.name,
                "evidence": clause.evidence,
                "page": clause.page or 1,
                "confidence": clause.confidence or 0.95,
            })

    return evidence


@router.get("/evidences/all")
async def get_all_evidences(db: Session = Depends(get_db)):
    fields = db.query(PolicyField).all()
    clauses = db.query(Clause).all()

    evidence = []
    for field in fields:
        if field.evidence:
            policy = db.query(Policy).filter(Policy.id == field.policy_id).first()
            policy_name = policy.policy_number if policy else f"Apólice #{field.policy_id}"
            evidence.append({
                "source": "field",
                "policy_id": field.policy_id,
                "policy_name": policy_name,
                "field_name": field.field_name,
                "evidence": field.evidence,
                "page": field.page or 1,
                "value": field.value,
                "confidence": 0.94,
            })

    for clause in clauses:
        if clause.evidence:
            policy = db.query(Policy).filter(Policy.id == clause.policy_id).first()
            policy_name = policy.policy_number if policy else f"Apólice #{clause.policy_id}"
            evidence.append({
                "source": "clause",
                "policy_id": clause.policy_id,
                "policy_name": policy_name,
                "clause_name": clause.name,
                "evidence": clause.evidence,
                "page": clause.page or 1,
                "confidence": 0.96 if clause.importance == 'ALTA' else 0.91,
            })

    return evidence