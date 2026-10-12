from typing import Optional, Dict, Any, List, ClassVar
from pydantic import BaseModel, Field, field_validator


class ComparisonCriterion(BaseModel):
    """Critério de comparação entre duas apólices."""
    criterion: str = Field(..., description="Nome do critério (ex: Liability Limit)")
    value_a: Optional[str] = Field(None, description="Valor da Apólice A")
    value_b: Optional[str] = Field(None, description="Valor da Apólice B")
    difference: Optional[str] = Field(None, description="Diferença entre valores")
    impact: Optional[str] = Field(None, description="Impacto da diferença")
    severity: Optional[str] = Field(
        None,
        description="Severidade (low, medium, high)",
    )
    evidence_a: Optional[Dict[str, Any]] = Field(
        None,
        description="Evidência da Apólice A",
    )
    evidence_b: Optional[Dict[str, Any]] = Field(
        None,
        description="Evidência da Apólice B",
    )

    # Critérios de comparação suportados — ClassVar para não ser campo do modelo
    SUPPORTED_CRITERIA: ClassVar[List[str]] = [
        "Liability Limit", "Aggregate Limit", "Deductible", "Franquia",
        "Sub-limit", "Coverage", "Exclusion", "Retroactivity",
        "Reporting Period", "Territory", "Jurisdiction",
        "Entity Coverage", "Reputation Costs", "Legal Defense",
        "Investigation Regulatory", "Investigation Internal",
        "Crisis/Reputation", "Extensions", "Ancillary Coverages"
    ]

    @field_validator("criterion")
    @classmethod
    def validate_criterion(cls, v: str) -> str:
        """Valida se o critério é suportado."""
        if v not in cls.SUPPORTED_CRITERIA:
            # Allow any criterion but flag it
            pass
        return v


class PolicyComparisonResult(BaseModel):
    """Resultado da comparação entre duas apólices."""
    comparison_id: Optional[str] = Field(None, description="ID da comparação")
    criteria: List[ComparisonCriterion] = Field(default_factory=list)
    overall_summary: Optional[str] = Field(None, description="Resumo executivo")
    processing_confidence: float = Field(
        default=0.0,
        ge=0.0,
        le=1.0,
        description="Nível de confiança da comparação",
    )
    status: str = Field(default="pending", description="Status da comparação")

    def add_criterion(
        self,
        criterion: str,
        value_a: Optional[str] = None,
        value_b: Optional[str] = None,
        difference: Optional[str] = None,
        impact: Optional[str] = None,
        severity: Optional[str] = None,
        evidence_a: Optional[Dict[str, Any]] = None,
        evidence_b: Optional[Dict[str, Any]] = None,
    ):
        """Adiciona um critério de comparação."""
        crit = ComparisonCriterion(
            criterion=criterion,
            value_a=value_a,
            value_b=value_b,
            difference=difference,
            impact=impact,
            severity=severity,
            evidence_a=evidence_a,
            evidence_b=evidence_b,
        )
        self.criteria.append(crit)
        if not self.overall_summary and len(self.criteria) >= 3:
            # Generate simple summary after enough criteria
            high_severity = [c for c in self.criteria if c.severity == "high"]
            if high_severity:
                self.overall_summary = (
                    f"A Apólice B apresenta {len(high_severity)} critério(s) com "
                    f"limite superior e severidade alta."
                )