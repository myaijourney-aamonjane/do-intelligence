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


class Comparison(Base):
    __tablename__ = "comparison"

    id = Column(Integer, primary_key=True, index=True)
    policy_a_id = Column(Integer, ForeignKey("policy.id"), nullable=False)
    policy_b_id = Column(Integer, ForeignKey("policy.id"), nullable=False)
    summary = Column(Text, nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    policy_a = relationship("Policy", foreign_keys=[policy_a_id], back_populates="comparisons_as_a")
    policy_b = relationship("Policy", foreign_keys=[policy_b_id], back_populates="comparisons_as_b")
    items = relationship("ComparisonItem", back_populates="comparison")