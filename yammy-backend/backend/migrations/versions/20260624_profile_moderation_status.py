"""Replace profile_moderation_approved with profile_moderation_status enum."""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision = "20260624_profile_moderation_status"
down_revision = "20260623_tarot_compatibility_history"
branch_labels = None
depends_on = None

MODERATION_STATUS = sa.Enum(
    "approved",
    "pending",
    "rejected",
    name="profilemoderationstatusenum",
    create_type=False,
)


def _enum_exists(conn, name: str) -> bool:
    return (
        conn.execute(
            sa.text("SELECT 1 FROM pg_type WHERE typname = :name"),
            {"name": name},
        ).scalar()
        is not None
    )


def _column_exists(conn, table: str, column: str) -> bool:
    return column in {c["name"] for c in inspect(conn).get_columns(table)}


def upgrade() -> None:
    conn = op.get_bind()

    if not _enum_exists(conn, "profilemoderationstatusenum"):
        sa.Enum(
            "approved",
            "pending",
            "rejected",
            name="profilemoderationstatusenum",
        ).create(conn, checkfirst=True)

    if not _column_exists(conn, "users", "profile_moderation_status"):
        op.add_column(
            "users",
            sa.Column(
                "profile_moderation_status",
                MODERATION_STATUS,
                nullable=False,
                server_default="pending",
            ),
        )

    if _column_exists(conn, "users", "profile_moderation_approved"):
        op.execute(
            """
            UPDATE users
            SET profile_moderation_status = CASE
                WHEN profile_moderation_approved THEN 'approved'::profilemoderationstatusenum
                ELSE 'pending'::profilemoderationstatusenum
            END
            """
        )
        op.drop_column("users", "profile_moderation_approved")

    op.alter_column("users", "profile_moderation_status", server_default=None)


def downgrade() -> None:
    conn = op.get_bind()

    if not _column_exists(conn, "users", "profile_moderation_approved"):
        op.add_column(
            "users",
            sa.Column(
                "profile_moderation_approved",
                sa.Boolean(),
                nullable=False,
                server_default=sa.false(),
            ),
        )

    if _column_exists(conn, "users", "profile_moderation_status"):
        op.execute(
            """
            UPDATE users
            SET profile_moderation_approved = (
                profile_moderation_status = 'approved'::profilemoderationstatusenum
            )
            """
        )
        op.drop_column("users", "profile_moderation_status")

    if _enum_exists(conn, "profilemoderationstatusenum"):
        sa.Enum(name="profilemoderationstatusenum").drop(conn, checkfirst=True)
