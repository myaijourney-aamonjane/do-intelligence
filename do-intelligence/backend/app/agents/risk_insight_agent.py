import uuid
from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field


class Insight(BaseModel):
    """Insight gerado a partir da comparação ou análise de apólices."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    criterion: str = Field(..., description="Critério ao qual o insight se refere")
    policy_a: Optional[str] = Field(None, description="Informação da Apólice A")
    policy_b: Optional[str] = Field(None, description="Informação da Apólice B")
    insight_text: str = Field(..., description="Texto do insight explicativo")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confiança do insight")
    severity: str = Field(
        ..., description="Severidade (low, medium, high)",
    )
    evidence_a: Optional[Dict[str, Any]] = Field(None, description="Evidência da Apólice A")
    evidence_b: Optional[Dict[str, Any]] = Field(None, description="Evidência da Apólice B")
    generated_at: datetime = Field(
        default_factory=datetime.now,
        description="Data/hora de geração",
    )

    model_config = {"protected_namespaces": ()}


class RiskInsights(BaseModel):
    """Coleção de insights gerados a partir da comparação de apólices."""
    insights: List[Insight] = Field(default_factory=list)
    total_insights: int = Field(default=0)
    high_severity_count: int = Field(default=0)
    medium_severity_count: int = Field(default=0)
    low_severity_count: int = Field(default=0)

    def add_insight(
        self,
        criterion: str,
        policy_a: Optional[str] = None,
        policy_b: Optional[str] = None,
        insight_text: str = "",
        confidence: float = 0.5,
        severity: str = "medium",
        evidence_a: Optional[Dict[str, Any]] = None,
        evidence_b: Optional[Dict[str, Any]] = None,
    ):
        """Adiciona um insight à coleção."""
        insight = Insight(
            criterion=criterion,
            policy_a=policy_a,
            policy_b=policy_b,
            insight_text=insight_text,
            confidence=confidence,
            severity=severity,
            evidence_a=evidence_a,
            evidence_b=evidence_b,
        )
        self.insights.append(insight)
        self.total_insights += 1

        # Contar por severidade
        if severity == "high":
            self.high_severity_count += 1
        elif severity == "medium":
            self.medium_severity_count += 1
        elif severity == "low":
            self.low_severity_count += 1

    def get_high_severity_insights(self) -> List[Insight]:
        """Retorna insights com severidade alta."""
        return [i for i in self.insights if i.severity == "high"]

    def get_summary(self) -> str:
        """Gera um resumo dos insights."""
        if not self.insights:
            return "Não há insights gerados."

        high_insights = self.get_high_severity_insights()
        if high_insights:
            return (
                f"Existem {len(high_insights)} ponto(s) de atenção "
                f"com severidade alta nesta comparação."
            )

        return f"Foram gerados {len(self.insights)} insight(s) de análise."