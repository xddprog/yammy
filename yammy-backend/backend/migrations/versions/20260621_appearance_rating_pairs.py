"""Replace ratings with appearance_rating_pairs."""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect
from sqlalchemy.dialects.postgresql import UUID


revision = "20260621_appearance_rating_pairs"
down_revision = "20260619_admin_panel"
branch_labels = None
depends_on = None


def _table_exists(conn, table: str) -> bool:
    return table in inspect(conn).get_table_names()


def upgrade() -> None:
    conn = op.get_bind()

    if not _table_exists(conn, "appearance_rating_pairs"):
        op.create_table(
            "appearance_rating_pairs",
            sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
            sa.Column("user_a_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
            sa.Column("user_b_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
            sa.Column("score_by_a", sa.Integer(), nullable=True),
            sa.Column("score_by_b", sa.Integer(), nullable=True),
            sa.Column("score_by_a_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("score_by_b_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("mutual_notified_at", sa.DateTime(timezone=True), nullable=True),
            sa.UniqueConstraint("user_a_id", "user_b_id", name="unique_appearance_rating_pair"),
        )

        if _table_exists(conn, "ratings"):
            op.execute(
                """
                INSERT INTO appearance_rating_pairs (
                    id, user_a_id, user_b_id,
                    score_by_a, score_by_b,
                    score_by_a_at, score_by_b_at,
                    created_at, updated_at
                )
                SELECT
                    gen_random_uuid(),
                    LEAST(rater_user_id, rated_user_id),
                    GREATEST(rater_user_id, rated_user_id),
                    MAX(CASE WHEN rater_user_id < rated_user_id THEN score END),
                    MAX(CASE WHEN rater_user_id > rated_user_id THEN score END),
                    MAX(CASE WHEN rater_user_id < rated_user_id THEN NOW() END),
                    MAX(CASE WHEN rater_user_id > rated_user_id THEN NOW() END),
                    NOW(),
                    NOW()
                FROM ratings
                GROUP BY LEAST(rater_user_id, rated_user_id), GREATEST(rater_user_id, rated_user_id)
                """
            )
            op.drop_table("ratings")
    elif _table_exists(conn, "ratings"):
        op.drop_table("ratings")


def downgrade() -> None:
    conn = op.get_bind()

    op.create_table(
        "ratings",
        sa.Column("rater_user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("rated_user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("score", sa.Integer(), nullable=False),
        sa.UniqueConstraint("rater_user_id", "rated_user_id", name="unique_rating_pair"),
    )

    if _table_exists(conn, "appearance_rating_pairs"):
        op.execute(
            """
            INSERT INTO ratings (rater_user_id, rated_user_id, score)
            SELECT user_a_id, user_b_id, score_by_a
            FROM appearance_rating_pairs
            WHERE score_by_a IS NOT NULL
            UNION ALL
            SELECT user_b_id, user_a_id, score_by_b
            FROM appearance_rating_pairs
            WHERE score_by_b IS NOT NULL
            """
        )
        op.drop_table("appearance_rating_pairs")
