# Real Product Flow

The demo route stays available at `/exam/demo-neet-2026`, but the platform now also supports a database-backed exam lifecycle.

## What Works In The Real Flow

1. Examiner registers or logs in.
2. Examiner creates an exam.
3. Examiner uploads real questions.
4. Backend encrypts question payloads with AES-256-GCM.
5. Backend stores safe public delivery payloads for released exams.
6. Backend hashes each full question and answer key.
7. Examiner locks the exam.
8. Backend builds a real Merkle root.
9. If blockchain is unavailable, backend creates a local tamper-evident ledger hash instead of failing.
10. Student logs in and sees locked/active exams.
11. Student starts a real exam session.
12. Frontend loads real questions from `/api/sessions/{session_id}/questions`.
13. Student answers are synced to the backend.
14. Backend records behavior/integrity events.
15. Student submits the session.
16. Backend certifies the result from hashed answer keys.
17. Result credential receives DID, VC hash, score, and ledger transaction hash.
18. Public verifier checks the stored credential.

## Local Test Script

Start infrastructure:

```bash
docker compose up -d postgres redis
```

Start backend:

```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000
```

Start frontend:

```bash
cd frontend
npm run dev
```

Open:

```txt
http://localhost:5173/examiner
```

Flow:

1. Register as examiner.
2. Create exam.
3. Upload questions.
4. Lock to chain. If Ganache is not running, local ledger fallback is expected.
5. Sign out.
6. Register as student at `/student`.
7. Enter the locked exam.
8. Submit answers.
9. Verify result credential.

## Production Notes

This is still a production-MVP foundation, not a national-exam system yet.

Next hardening steps:

- Add Alembic migrations.
- Move key management to Vault or an HSM.
- Replace local ledger fallback with Hyperledger Fabric.
- Add tenant isolation and PostgreSQL row-level security.
- Add audit log export.
- Add manual review workflow for flagged sessions.
- Add offline center sync.
