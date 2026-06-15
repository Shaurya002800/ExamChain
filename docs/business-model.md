# ExamChain Business Model

ExamChain should be positioned as examination trust infrastructure, not an ed-tech quiz product.

## Mission

Make high-stakes exams fair, verifiable, and resilient for public institutions, universities, and assessment providers.

## Ideal Customer Profiles

### 1. Universities And Autonomous Colleges

Best first customers because procurement is easier than national bodies.

Pain:

- Paper leaks
- Manual invigilation cost
- Result disputes
- Remote and hybrid exam pressure

Pitch:

“Run secure internal exams with verifiable result certificates and live integrity reports.”

### 2. Coaching And Scholarship Exam Providers

Good early revenue segment.

Pain:

- Large online scholarship tests
- Cheating destroys rank credibility
- Need fast public result verification

Pitch:

“Protect rank lists and scholarship outcomes with tamper-evident certificates.”

### 3. Corporate Assessment Platforms

Good B2B integration opportunity.

Pain:

- Remote hiring test fraud
- Candidate impersonation
- Need audit trail for hiring decisions

Pitch:

“API-first exam integrity and credential verification layer.”

### 4. Government Exam Bodies

Long-term, high-value segment.

Pain:

- Public trust failures
- Political and legal consequences
- Massive scale
- Offline-center operations

Pitch:

“Permissioned, auditable exam infrastructure deployable in government-controlled environments.”

## Product Packages

### ExamChain Starter

For colleges and pilots.

- 1 tenant
- Web exam portal
- Basic question vault
- Result QR verification
- Integrity event log
- Up to 100 candidates/month

Price:

- Free for pilots
- Later: ₹0 to ₹999/month for small institutions

### ExamChain Pro

For universities, coaching providers, and corporate exams.

- Multi-exam dashboard
- AI integrity agents
- Encrypted question bank
- Result certificates
- Audit exports
- Branding
- API access

Price:

- ₹5 to ₹20 per candidate attempt
- Minimum monthly platform fee later

### ExamChain Enterprise

For state/national exam bodies.

- Dedicated tenant
- On-prem or private cloud deployment
- Hyperledger Fabric network
- Offline center nodes
- SLA and support
- Custom compliance reports
- Dedicated security review

Price:

- Annual contract
- Setup fee + per-attempt fee
- Potential range: ₹25L to ₹2Cr+ annually depending on scale

## Revenue Model

Use a hybrid model:

- Per candidate attempt
- Annual platform fee
- Enterprise setup and support fee
- Optional add-ons:
  - Offline center mode
  - Advanced proctoring
  - Custom Fabric network
  - API integration
  - White-label mobile app

## Why Customers Would Pay

ExamChain reduces:

- Re-exam cost
- Result dispute cost
- Manual audit cost
- Reputational damage
- Operational leakage risk

ExamChain increases:

- Public trust
- Result portability
- Audit readiness
- Exam operations visibility

## Competitive Positioning

Most competitors sell one part of the stack:

- Online exam UI
- Proctoring
- LMS testing
- Credential issuing

ExamChain’s wedge:

“A single trust chain from question creation to public result verification.”

## Moat

Technical moat:

- Integrity data graph over many exam sessions
- Question quality analytics
- Ledger-backed audit history
- Offline-center sync protocol
- Institution-specific compliance workflows

Business moat:

- Trust with institutions
- Integrations with existing exam processes
- Historical risk data
- Audit reports and policy alignment

## Go-To-Market Plan

### Phase 1: Hackathon To Pilot

Timeline: 0-2 months

- Polish demo
- Build hosted pilot version
- Add tenant creation
- Create sample institution admin flow
- Build PDF audit report export
- Approach 5 colleges/coaching institutes

Goal:

- 1 pilot with 50-200 candidates

### Phase 2: Paid Small Institution Product

Timeline: 2-6 months

- Multi-tenant SaaS
- Real question bank
- Basic proctoring
- Signed result credentials
- Admin analytics
- Payment flow

Goal:

- 5-10 paying institutions

### Phase 3: Enterprise Readiness

Timeline: 6-12 months

- Hyperledger Fabric network
- Offline center node
- Security hardening
- Compliance documents
- Incident response playbook
- Pen test using OWASP ZAP and manual review

Goal:

- Large university or state-level pilot

### Phase 4: Government/High-Stakes Exams

Timeline: 12-24 months

- On-prem deployment package
- HSM integration
- DR/backup plan
- Formal SLA
- Accessibility certification
- External security audit

Goal:

- Enterprise contract or government PoC

## Key Metrics

Product metrics:

- Exam attempts processed
- Credential verifications
- Average API latency
- Failed sync rate
- Agent false positive rate
- Agent false negative rate
- Manual review resolution time

Business metrics:

- Active institutions
- Monthly exam attempts
- Revenue per attempt
- Pilot-to-paid conversion
- Churn
- Support tickets per 1,000 attempts

Trust metrics:

- Disputes per exam
- Re-exams avoided
- Question leak incidents
- Credential verification success rate

## Public Benefit Angle

ExamChain should not be framed only as a company. It should be framed as infrastructure for fairness.

Public value:

- Students can verify results without depending on opaque systems.
- Institutions can prove exam integrity.
- Honest candidates are protected from cheating rings.
- Question leaks become easier to detect and harder to exploit.
- Result tampering becomes publicly challengeable.

## Immediate Next Product Improvements

Highest priority:

1. Tenant model in database and UI
2. Real examiner question-bank workflow
3. Audit report PDF export
4. Backend-driven exam attempt flow
5. Result credential signing with real key management
6. WebAuthn/passkey login for examiners/admins
7. Offline answer cache with sync status
8. Security event review queue
9. Production deployment blueprint
10. Pilot onboarding guide

## Founder Narrative

ExamChain exists because exams should not depend on blind trust.

The story to tell:

“Every candidate deserves an exam system where question access, answer submission, scoring, and result publication are provable. ExamChain brings cryptographic trust, autonomous monitoring, and public verification to the exam lifecycle.”
