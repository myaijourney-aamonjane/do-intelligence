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


class PolicyField(Base):
    __tablename__ = "policy_field"

    id = Column(Integer, primary_key=True, index=True)
    policy_id = Column(Integer, ForeignKey("policy.id"), nullable=False)
    field_name = Column(String, nullable=False)
    value = Column(String, nullable=True)
    confidence = Column(JSON, nullable=True)
    page = Column(Integer, nullable=True)
    evidence = Column(Text, nullable=True)
    source = Column(String, nullable=True)

    policy = relationship("Policy", back_populates="fields")