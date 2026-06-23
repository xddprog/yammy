"""Tarot compatibility history table."""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect
from sqlalchemy.dialects.postgresql import JSONB, UUID


revision = "20260623_tarot_compatibility_history"
down_revision = "20260623_ai_search_target_gender"
branch_labels = None
depends_on = None

TAROT_STATUS_ENUM = sa.Enum(
    "searching",
    "ready",
    "failed",
    name="aisearchhistorystatusenum",
    create_type=False,
)


def _table_exists(conn, table: str) -> bool:
    return table in inspect(conn).get_table_names()


def upgrade() -> None:
    conn = op.get_bind()
    if _table_exists(conn, "tarot_compatibility_history"):
        return

    op.create_table(
        "tarot_compatibility_history",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column(
            "partner_user_id",
            UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("status", TAROT_STATUS_ENUM, nullable=False, server_default="searching"),
        sa.Column("result_json", JSONB, nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index(
        "ix_tarot_compatibility_history_user_id",
        "tarot_compatibility_history",
        ["user_id"],
    )
    op.create_index(
        "ix_tarot_compatibility_history_partner_user_id",
        "tarot_compatibility_history",
        ["partner_user_id"],
    )
    op.create_index(
        "ix_tarot_compatibility_history_status",
        "tarot_compatibility_history",
        ["status"],
    )
    op.create_index(
        "ix_tarot_compatibility_user_partner_created",
        "tarot_compatibility_history",
        ["user_id", "partner_user_id", "created_at"],
    )


def downgrade() -> None:
    conn = op.get_bind()
    if not _table_exists(conn, "tarot_compatibility_history"):
        return
    op.drop_index("ix_tarot_compatibility_user_partner_created", table_name="tarot_compatibility_history")
    op.drop_index("ix_tarot_compatibility_history_status", table_name="tarot_compatibility_history")
    op.drop_index("ix_tarot_compatibility_history_partner_user_id", table_name="tarot_compatibility_history")
    op.drop_index("ix_tarot_compatibility_history_user_id", table_name="tarot_compatibility_history")
    op.drop_table("tarot_compatibility_history")
