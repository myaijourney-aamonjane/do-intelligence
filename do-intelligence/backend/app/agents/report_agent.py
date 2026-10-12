import uuid
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
from datetime import datetime


class ReportSection(BaseModel):
    """Seção de um relatório de comparação de apólices."""
    section_name: str = Field(..., description="Nome da seção")
    content: str = Field(..., description="Conteúdo da seção")
    order: int = Field(default=0, description="Ordem de apresentação")


class ExecutiveSummary(BaseModel):
    """Resumo executivo do relatório de comparação."""
    title: str = Field(default="Relatório Comparativo D&O Intelligence")
    subtitle: Optional[str] = Field(None, description="Subtítulo opcional")
    policy_a_title: Optional[str] = Field(None, description="Título da Apólice A")
    policy_b_title: Optional[str] = Field(None, description="Título da Apólice B")
    key_findings: List[str] = Field(
        default_factory=list,
        description="Principais descobertas",
    )
    total_differences: int = Field(default=0, description="Total de diferenças encontradas")
    highest_severity: Optional[str] = Field(
        None,
        description="Maior severidade encontrada (low, medium, high)",
    )

    def add_finding(self, finding: str):
        """Adiciona um achado ao resumo executivo."""
        self.key_findings.append(finding)
        self.total_differences += 1


class ComparisonReport(BaseModel):
    """Estrutura completa de um relatório comparativo de apólices."""
    report_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    generated_at: datetime = Field(default_factory=datetime.now)
    title: str = Field(default="D&O Intelligence - Relatório Comparativo")
    policy_a_id: Optional[str] = Field(None, description="ID da Apólice A")
    policy_b_id: Optional[str] = Field(None, description="ID da Apólice B")
    policy_a_number: Optional[str] = Field(None, description="Número da Apólice A")
    policy_b_number: Optional[str] = Field(None, description="Número da Apólice B")
    executive_summary: ExecutiveSummary = Field(default_factory=ExecutiveSummary)
    sections: List[ReportSection] = Field(
        default_factory=list,
        description="Seções do relatório",
    )
    comparison_criteria_count: int = Field(
        default=0,
        description="Número de critérios comparados",
    )
    insights_count: int = Field(
        default=0,
        description="Número de insights gerados",
    )
    status: str = Field(default="generated", description="Status do relatório")

    def add_section(self, section_name: str, content: str, order: int = 0) -> ReportSection:
        """Adiciona uma seção ao relatório."""
        section = ReportSection(
            section_name=section_name,
            content=content,
            order=order,
        )
        # Encontrar a posição correta mantendo ordem
        inserted = False
        for i, existing in enumerate(self.sections):
            if existing.order >= order:
                self.sections.insert(i, section)
                inserted = True
                break
        if not inserted:
            self.sections.append(section)
        return section

    def to_dict(self) -> Dict[str, Any]:
        """Converte o relatório para dicionário (para serialização JSON)."""
        return {
            "report_id": self.report_id,
            "generated_at": self.generated_at.isoformat(),
            "title": self.title,
            "policy_a_id": self.policy_a_id,
            "policy_b_id": self.policy_b_id,
            "policy_a_number": self.policy_a_number,
            "policy_b_number": self.policy_b_number,
            "executive_summary": {
                "title": self.executive_summary.title,
                "subtitle": self.executive_summary.subtitle,
                "policy_a_title": self.executive_summary.policy_a_title,
                "policy_b_title": self.executive_summary.policy_b_title,
                "key_findings": self.executive_summary.key_findings,
                "total_differences": self.executive_summary.total_differences,
                "highest_severity": self.executive_summary.highest_severity,
            },
            "sections": [
                {
                    "section_name": s.section_name,
                    "content": s.content,
                    "order": s.order,
                }
                for s in self.sections
            ],
            "comparison_criteria_count": self.comparison_criteria_count,
            "insights_count": self.insights_count,
            "status": self.status,
        }