"""add_skipped_to_user_timetables

Revision ID: a1b2c3d4e5f6
Revises: 3399ef2235c8
Branch Labels: None
Depends On: None

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '3399ef2235c8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('user_timetables', sa.Column('skipped', postgresql.JSONB(astext_type=sa.Text()), server_default=sa.text("'[]'"), nullable=False))


def downgrade() -> None:
    op.drop_column('user_timetables', 'skipped')
