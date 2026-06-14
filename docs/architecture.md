# ExamChain Architecture

ExamChain is designed as a zero-trust exam lifecycle where every critical phase leaves a verifiable proof trail.

## Core Flow

1. Examiner creates an exam and commits the question vault fingerprint before delivery.
2. Student starts a locked exam session through the React portal.
3. Backend services stream browser and answer events into integrity agents.
4. Agents score session risk and emit an audit trail for suspicious behavior.
5. Result Certifier issues a credential with DID, credential hash, Merkle root, and chain transaction metadata.
6. Public verifier checks the credential fingerprint without requiring access to private exam data.

## Components

- `frontend`: React + Vite demo portal for landing, student exam, results, dashboards, and public verification.
- `backend`: FastAPI service layer for auth, exams, agents, blockchain integration, and credential APIs.
- `contracts`: Hardhat smart contracts for exam and credential proof anchoring.
- `backend/agents`: Autonomous security agents aligned with the FAR AWAY blueprint.
- `frontend/src/data/demo.js`: Offline demo dataset that keeps the Round 1 walkthrough stable even if backend services are unavailable.

## Security Decisions

- Hash-first proof model for question and credential states.
- Demo-safe public verifier path that avoids exposing private student answers.
- Agent events are role-scoped and auditable instead of hidden behind a single risk score.
- Frontend fallback mode is explicit and packaged only to protect the hackathon demo experience.

## Demo Route

Use this route for the fastest reviewer path:

```txt
http://127.0.0.1:5173/exam/demo-neet-2026
```

Recommended walkthrough:

1. Start the exam.
2. Answer the four demo questions.
3. Trigger the attack simulation once.
4. Submit and certify the result.
5. Open the public verifier link and verify the credential.
