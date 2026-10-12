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


class ComparisonItem(Base):
    __tablename__ = "comparison_item"

    id = Column(Integer, primary_key=True, index=True)
    comparison_id = Column(Integer, ForeignKey("comparison.id"), nullable=False)
    criterion = Column(String, nullable=False)
    value_a = Column(String, nullable=True)
    value_b = Column(String, nullable=True)
    difference = Column(String, nullable=True)
    impact = Column(String, nullable=True)
    severity = Column(String, nullable=True)
    evidence_a = Column(JSON, nullable=True)
    evidence_b = Column(JSON, nullable=True)

    comparison = relationship("Comparison", back_populates="items")