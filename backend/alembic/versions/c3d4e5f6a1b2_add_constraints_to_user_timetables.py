"""add_constraints_to_user_timetables

Revision ID: c3d4e5f6a1b2
Revises: a1b2c3d4e5f6
Branch Labels: None
Depends On: None

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = 'c3d4e5f6a1b2'
down_revision: Union[str, Sequence[str], None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('user_timetables', sa.Column('constraints', postgresql.JSONB(astext_type=sa.Text()), server_default=sa.text("'[]'"), nullable=False))


def downgrade() -> None:
    op.drop_column('user_timetables', 'constraints')
