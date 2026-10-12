from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Text,
    JSON,
    ForeignKey,
)
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from ..core.config import Base


class Checkpoint(Base):
    __tablename__ = "checkpoint"

    id = Column(Integer, primary_key=True, index=True)
    chave_ctx = Column(String, nullable=False, index=True)
    tipo = Column(String, nullable=False)
    estado = Column(JSON, nullable=True)
    passo = Column(String, nullable=True)
    criado_em = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    atualizado_em = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    documents = relationship("Document", back_populates="checkpoint")