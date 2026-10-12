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


class Policy(Base):
    __tablename__ = "policy"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("document.id"), nullable=False)
    policy_number = Column(String, nullable=True)
    insurer = Column(String, nullable=True)
    policyholder = Column(String, nullable=True)
    currency = Column(String, nullable=True)
    start_date = Column(String, nullable=True)
    end_date = Column(String, nullable=True)
    liability_limit = Column(String, nullable=True)
    aggregate_limit = Column(String, nullable=True)
    deductible = Column(String, nullable=True)
    premium = Column(String, nullable=True)
    retroactivity = Column(String, nullable=True)
    reporting_period = Column(String, nullable=True)
    territory = Column(String, nullable=True)
    jurisdiction = Column(String, nullable=True)
    status = Column(String, default="ACTIVE")
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    owner_id = Column(Integer, ForeignKey("user.id"), nullable=True)
    owner = relationship("User", back_populates="policies")
    document = relationship("Document", back_populates="policies")
    fields = relationship("PolicyField", back_populates="policy")
    clauses = relationship("Clause", back_populates="policy")
    comparisons_as_a = relationship(
        "Comparison",
        primaryjoin="Policy.id == Comparison.policy_a_id",
        foreign_keys="[Comparison.policy_a_id]",
        back_populates="policy_a",
        viewonly=True,
    )
    comparisons_as_b = relationship(
        "Comparison",
        primaryjoin="Policy.id == Comparison.policy_b_id",
        foreign_keys="[Comparison.policy_b_id]",
        back_populates="policy_b",
        viewonly=True,
    )