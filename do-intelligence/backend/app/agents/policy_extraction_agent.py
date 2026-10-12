from typing import Optional, List, ClassVar
from pydantic import BaseModel, Field, field_validator


class ExtractedField(BaseModel):
    """Estruturada saída padronizada de um campo extraído por agente de IA."""
    field: str = Field(..., description="Nome do campo extraído")
    value: Optional[str] = Field(None, description="Valor extraído")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Nível de confiança (0 a 1)")
    page: Optional[int] = Field(None, description="Número da página onde foi encontrado")
    evidence: Optional[str] = Field(None, description="Trecho de evidência do documento")
    source: Optional[str] = Field(None, description="Fonte/origem do dado")

    model_config = {"protected_namespaces": ()}


class PolicyData(BaseModel):
    """Dados estruturados extraídos de uma apólice D&O."""

    # Identificação
    seguradora: Optional[str] = None
    tomador: Optional[str] = None
    segurados: Optional[List[str]] = None
    numero_apolice: Optional[str] = None
    moeda: Optional[str] = None
    data_inicio: Optional[str] = None
    data_fim: Optional[str] = None

    # Valores
    limite_responsabilidade: Optional[str] = None
    limite_agregado: Optional[str] = None
    sublimites: Optional[dict] = Field(default_factory=dict)
    franquia: Optional[str] = None
    deductible: Optional[str] = None
    premio: Optional[float] = None

    # Coberturas
    coberturas: Optional[List[str]] = None

    # Condições
    retroatividade: Optional[str] = None
    periodo_reporte: Optional[str] = None
    territorio: Optional[str] = None
    jurisdicao: Optional[str] = None
    obrigações_segurado: Optional[List[str]] = None

    # Confiança global
    confianca_geral: float = Field(default=0.0, ge=0.0, le=1.0)

    @field_validator("data_inicio", "data_fim", mode="before")
    @classmethod
    def parse_dates(cls, v: Optional[str]) -> Optional[str]:
        """Tenta converter strings de data para formato padronizado."""
        if v:
            return str(v)[:10]  # Simple truncation - real impl would parse properly
        return v