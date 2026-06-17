"""baseline tenants keys review

Revision ID: 20260616_0001
Revises:
Create Date: 2026-06-16
"""

from typing import Sequence, Union

from alembic import op


revision: str = "20260616_0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS tenants (
            id VARCHAR PRIMARY KEY,
            name VARCHAR(200) NOT NULL,
            slug VARCHAR(120) UNIQUE NOT NULL,
            logo_url TEXT,
            primary_color VARCHAR(20) DEFAULT '#0EA5E9',
            created_at TIMESTAMP DEFAULT now()
        )
    """)
    op.execute("""
        INSERT INTO tenants (id, name, slug, primary_color)
        VALUES ('default', 'ExamChain Default', 'default', '#0EA5E9')
        ON CONFLICT (id) DO NOTHING
    """)
    op.execute("ALTER TABLE students ADD COLUMN IF NOT EXISTS tenant_id VARCHAR DEFAULT 'default'")
    op.execute("ALTER TABLE examiners ADD COLUMN IF NOT EXISTS tenant_id VARCHAR DEFAULT 'default'")
    op.execute("ALTER TABLE exams ADD COLUMN IF NOT EXISTS tenant_id VARCHAR DEFAULT 'default'")
    op.execute("ALTER TABLE exams ADD COLUMN IF NOT EXISTS ledger_mode VARCHAR(30) DEFAULT 'LOCAL_LEDGER'")
    op.execute("ALTER TABLE exams ADD COLUMN IF NOT EXISTS ledger_error TEXT")
    op.execute("ALTER TABLE questions ADD COLUMN IF NOT EXISTS public_payload JSON")
    op.execute("ALTER TABLE questions ADD COLUMN IF NOT EXISTS correct_answer_hash VARCHAR(66)")
    op.execute("ALTER TABLE questions ADD COLUMN IF NOT EXISTS points DOUBLE PRECISION DEFAULT 1.0")
    op.execute("""
        CREATE TABLE IF NOT EXISTS exam_keys (
            id VARCHAR PRIMARY KEY,
            exam_id VARCHAR UNIQUE NOT NULL REFERENCES exams(id),
            tenant_id VARCHAR DEFAULT 'default',
            encrypted_key TEXT NOT NULL,
            key_fingerprint VARCHAR(66) NOT NULL,
            status VARCHAR(20) DEFAULT 'ACTIVE',
            created_at TIMESTAMP DEFAULT now()
        )
    """)
    op.execute("ALTER TABLE results ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'PENDING'")
    op.execute("ALTER TABLE results ADD COLUMN IF NOT EXISTS reviewed_by VARCHAR")
    op.execute("ALTER TABLE results ADD COLUMN IF NOT EXISTS review_note TEXT")
    op.execute("UPDATE students SET tenant_id = 'default' WHERE tenant_id IS NULL")
    op.execute("UPDATE examiners SET tenant_id = 'default' WHERE tenant_id IS NULL")
    op.execute("UPDATE exams SET tenant_id = 'default' WHERE tenant_id IS NULL")
    op.execute("UPDATE results SET status = 'CERTIFIED' WHERE status IS NULL AND vc_hash IS NOT NULL")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS exam_keys")
    op.execute("ALTER TABLE results DROP COLUMN IF EXISTS review_note")
    op.execute("ALTER TABLE results DROP COLUMN IF EXISTS reviewed_by")
    op.execute("ALTER TABLE results DROP COLUMN IF EXISTS status")
    op.execute("ALTER TABLE questions DROP COLUMN IF EXISTS points")
    op.execute("ALTER TABLE questions DROP COLUMN IF EXISTS correct_answer_hash")
    op.execute("ALTER TABLE questions DROP COLUMN IF EXISTS public_payload")
    op.execute("ALTER TABLE exams DROP COLUMN IF EXISTS ledger_error")
    op.execute("ALTER TABLE exams DROP COLUMN IF EXISTS ledger_mode")
    op.execute("ALTER TABLE exams DROP COLUMN IF EXISTS tenant_id")
    op.execute("ALTER TABLE examiners DROP COLUMN IF EXISTS tenant_id")
    op.execute("ALTER TABLE students DROP COLUMN IF EXISTS tenant_id")
    op.execute("DROP TABLE IF EXISTS tenants")
