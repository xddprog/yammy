"""Support ticket conversations and messages."""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect
from sqlalchemy.dialects import postgresql


revision = "20260625_support_tickets"
down_revision = "20260625_profile_moderation_feedback"
branch_labels = None
depends_on = None

REQUEST_TYPE = postgresql.ENUM(
    "suggestion", "problem", "bug", name="supportrequesttypeenum", create_type=False
)
CONVERSATION_STATUS = postgresql.ENUM(
    "open", "closed", name="supportconversationstatusenum", create_type=False
)
MESSAGE_DIRECTION = postgresql.ENUM(
    "user", "staff", name="supportmessagedirectionenum", create_type=False
)


def _enum_exists(conn, name: str) -> bool:
    return (
        conn.execute(
            sa.text("SELECT 1 FROM pg_type WHERE typname = :name"),
            {"name": name},
        ).scalar()
        is not None
    )


def _table_exists(conn, table: str) -> bool:
    return inspect(conn).has_table(table)


def upgrade() -> None:
    conn = op.get_bind()

    if not _enum_exists(conn, "supportrequesttypeenum"):
        REQUEST_TYPE.create(conn, checkfirst=True)
    if not _enum_exists(conn, "supportconversationstatusenum"):
        CONVERSATION_STATUS.create(conn, checkfirst=True)
    if not _enum_exists(conn, "supportmessagedirectionenum"):
        MESSAGE_DIRECTION.create(conn, checkfirst=True)

    if not _table_exists(conn, "support_conversations"):
        op.create_table(
            "support_conversations",
            sa.Column("id", sa.UUID(), nullable=False),
            sa.Column("telegram_id", sa.BigInteger(), nullable=False),
            sa.Column("user_id", sa.UUID(), nullable=True),
            sa.Column("request_type", REQUEST_TYPE, nullable=False),
            sa.Column("status", CONVERSATION_STATUS, nullable=False, server_default="open"),
            sa.Column("last_message_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(
            "ix_support_conversations_telegram_id",
            "support_conversations",
            ["telegram_id"],
        )
        op.create_index(
            "ix_support_conversations_status_last_message",
            "support_conversations",
            ["status", "last_message_at"],
        )

    if not _table_exists(conn, "support_messages"):
        op.create_table(
            "support_messages",
            sa.Column("id", sa.UUID(), nullable=False),
            sa.Column("conversation_id", sa.UUID(), nullable=False),
            sa.Column("direction", MESSAGE_DIRECTION, nullable=False),
            sa.Column("admin_id", sa.UUID(), nullable=True),
            sa.Column("content", sa.Text(), nullable=False),
            sa.Column("telegram_message_id", sa.BigInteger(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
            sa.ForeignKeyConstraint(["admin_id"], ["admins.id"]),
            sa.ForeignKeyConstraint(
                ["conversation_id"],
                ["support_conversations.id"],
                ondelete="CASCADE",
            ),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("telegram_message_id", name="uq_support_messages_telegram_message_id"),
        )
        op.create_index(
            "ix_support_messages_conversation_id",
            "support_messages",
            ["conversation_id"],
        )


def downgrade() -> None:
    conn = op.get_bind()
    if _table_exists(conn, "support_messages"):
        op.drop_table("support_messages")
    if _table_exists(conn, "support_conversations"):
        op.drop_table("support_conversations")
    if _enum_exists(conn, "supportmessagedirectionenum"):
        MESSAGE_DIRECTION.drop(conn, checkfirst=True)
    if _enum_exists(conn, "supportconversationstatusenum"):
        CONVERSATION_STATUS.drop(conn, checkfirst=True)
    if _enum_exists(conn, "supportrequesttypeenum"):
        REQUEST_TYPE.drop(conn, checkfirst=True)
