"""initial migration

Revision ID: 20260101_001
Revises: 
Create Date: 2026-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import function


# revision identifiers, used by Alembic.
revision = "20260101_001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "user",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("password_hash", sa.String(), nullable=False),
        sa.Column("full_name", sa.String(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("is_superuser", sa.Boolean(), nullable=False),
        sa.Column("last_login", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )
    op.create_table(
        "role",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("description", sa.String(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )
    op.create_table(
        "permission",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("action", sa.String(), nullable=False),
        sa.Column("resource", sa.String(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "user_role",
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("role_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["user.id"],),
        sa.ForeignKeyConstraint(["role_id"], ["role.id"],),
        sa.PrimaryKeyConstraint("user_id", "role_id"),
    )
    op.create_table(
        "audit_log",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column("action", sa.String(), nullable=False),
        sa.Column("entity", sa.String(), nullable=False),
        sa.Column("entity_id", sa.Integer(), nullable=True),
        sa.Column("dados_antes", sa.JSON(), nullable=True),
        sa.Column("dados_depois", sa.JSON(), nullable=True),
        sa.Column("ip", sa.String(), nullable=True),
        sa.Column("user_agent", sa.String(), nullable=True),
        sa.Column("data", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["user.id"],),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "setting",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("key", sa.String(), nullable=False),
        sa.Column("value", sa.JSON(), nullable=True),
        sa.Column("description", sa.String(), nullable=True),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column("atualizado_em", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["user.id"],),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("key"),
    )
    op.create_table(
        "checkpoint",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("chave_ctx", sa.String(), nullable=False),
        sa.Column("tipo", sa.String(), nullable=False),
        sa.Column("estado", sa.JSON(), nullable=True),
        sa.Column("passo", sa.String(), nullable=True),
        sa.Column("criado_em", sa.DateTime(), nullable=False),
        sa.Column("atualizado_em", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("chave_ctx"),
    )
    op.create_table(
        "document",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("filename", sa.String(), nullable=False),
        sa.Column("file_path", sa.String(), nullable=False),
        sa.Column("mime_type", sa.String(), nullable=False),
        sa.Column("page_count", sa.Integer(), nullable=True),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("owner_id", sa.Integer(), nullable=True),
        sa.Column("checkpoint_id", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["owner_id"], ["user.id"],),
        sa.ForeignKeyConstraint(["checkpoint_id"], ["checkpoint.id"],),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "policy",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("document_id", sa.Integer(), nullable=False),
        sa.Column("policy_number", sa.String(), nullable=True),
        sa.Column("insurer", sa.String(), nullable=True),
        sa.Column("policyholder", sa.String(), nullable=True),
        sa.Column("currency", sa.String(), nullable=True),
        sa.Column("start_date", sa.String(), nullable=True),
        sa.Column("end_date", sa.String(), nullable=True),
        sa.Column("liability_limit", sa.String(), nullable=True),
        sa.Column("deductible", sa.String(), nullable=True),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("owner_id", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint ["document_id"], ["document.id"],),
        sa.ForeignKeyConstraint ["owner_id"], ["user.id"],),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "policy_field",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("policy_id", sa.Integer(), nullable=False),
        sa.Column("field_name", sa.String(), nullable=False),
        sa.Column("value", sa.String(), nullable=True),
        sa.Column("confidence", sa.JSON(), nullable=True),
        sa.Column("page", sa.Integer(), nullable=True),
        sa.Column("evidence", sa.Text(), nullable=True),
        sa.Column("source", sa.String(), nullable=True),
        sa.ForeignKeyConstraint ["policy_id"], ["policy.id"],),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "clause",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("policy_id", sa.Integer(), nullable=False),
        sa.Column("category", sa.String(), nullable=False),
        sa.Column("name", sa.String(), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("importance", sa.String(), nullable=True),
        sa.Column("confidence", sa.JSON(), nullable=True),
        sa.Column("page", sa.Integer(), nullable=True),
        sa.Column("evidence", sa.Text(), nullable=True),
        sa.Column("source", sa.String(), nullable=True),
        sa.ForeignKeyConstraint ["policy_id"], ["policy.id"],),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "comparison",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column ("policy_a_id", sa.Integer(), nullable=False),
        sa.Column("policy_b_id", sa.Integer(), nullable=False),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint ["policy_a_id"], ["policy.id"],),
        sa.ForeignKeyConstraint ["policy_b_id"], ["policy.id"],),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "comparison_item",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column ("comparison_id", sa.Integer(), nullable=False),
        sa.Column("criterion", sa.String(), nullable=False),
        sa.Column("value_a", sa.String(), nullable=True),
        sa.Column("value_b", sa.String(), nullable=True),
        sa.Column("difference", sa.String(), nullable=True),
        sa.Column("impact", sa.String(), nullable=True),
        sa.Column("severity", sa.String(), nullable=True),
        sa.Column("evidence_a", sa.JSON(), nullable=True),
        sa.Column("evidence_b", sa.JSON(), nullable=True),
        sa.ForeignKeyConstraint ["comparison_id"], ["comparison.id"],),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("comparison_item")
    op.drop_table("comparison")
    op.drop_table("clause")
    op.drop_table("policy_field")
    op.drop_table("policy")
    op.drop_table("document")
    op.drop_table("checkpoint")
    op.drop_table("setting")
    op.drop_table("audit_log")
    op.drop_table("user_role")
    op.drop_table("permission")
    op.drop_table("role")