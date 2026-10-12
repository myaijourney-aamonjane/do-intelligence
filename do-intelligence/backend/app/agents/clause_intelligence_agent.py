from typing import Optional, List, ClassVar
from pydantic import BaseModel, Field, field_validator


class ClauseCategory(BaseModel):
    """Categoria de uma cláusula de apólice D&O."""
    category: str = Field(..., description="Categoria da cláusula")
    name: Optional[str] = Field(None, description="Nome da cláusula")
    description: Optional[str] = Field(None, description="Descrição da cláusula")
    importance: Optional[str] = Field(
        None,
        description="Importância (high, medium, low)",
    )
    confidence: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Nível de confiança",
    )
    page: Optional[int] = Field(None, description="Página onde encontrado")
    evidence: Optional[str] = Field(None, description="Trecho de evidência")
    source: Optional[str] = Field(None, description="Fonte do documento")

    # Categorias suportadas — ClassVar para não ser tratada como campo do modelo
    SUPPORTED_CATEGORIES: ClassVar[List[str]] = [
        "Coverage", "Exclusion", "Limitation", "Deductible",
        "Sublimit", "Condition", "Extension", "Obligation",
        "Definition", "Special Clause"
    ]

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: str) -> str:
        """Valida se a categoria é suportada."""
        if v not in cls.SUPPORTED_CATEGORIES:
            raise ValueError(
                f"Categoria não suportada. Use: {', '.join(cls.SUPPORTED_CATEGORIES)}"
            )
        return v


class ClauseAnalysisResult(BaseModel):
    """Resultado da análise de cláusulas por agente."""
    clauses: List[ClauseCategory] = Field(default_factory=list)
    total_found: int = Field(default=0)
    processing_confidence: float = Field(default=0.0, ge=0.0, le=1.0)

    def add_clause(self, category: str, name: Optional[str] = None,
                   description: Optional[str] = None, importance: Optional[str] = None,
                   confidence: float = 0.0, page: Optional[int] = None,
                   evidence: Optional[str] = None, source: Optional[str] = None):
        """Adiciona uma cláusula encontrada."""
        clause = ClauseCategory(
            category=category,
            name=name,
            description=description,
            importance=importance,
            confidence=confidence,
            page=page,
            evidence=evidence,
            source=source,
        )
        self.clauses.append(clause)
        self.total_found += 1
        self.processing_confidence = max(
            self.processing_confidence, confidence
        )