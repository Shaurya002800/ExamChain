export const DEMO_EXAM_ID = "demo-neet-2026";

export const DEMO_EXAM = {
  exam_id: DEMO_EXAM_ID,
  title: "National Scholarship Entrance Exam",
  subject: "Aptitude + Science",
  status: "ACTIVE",
  duration_mins: 12,
  total_marks: 100,
  merkle_root: "0x8f6f3a4c4d5e46b08b5d2ef0d3b5b8c9f1a2d6e4c7b9a081d65d7b8c09e9a311",
  vault_tx_hash: "0x647185b0c0a1d9185d55154fa06f13f8a7d8c52fe84a35eab7e8053ef30ac011",
  starts_at_label: "Live demo",
};

export const DEMO_QUESTIONS = [
  {
    id: "q-lock-01",
    text: "Which property makes a leaked encrypted question paper useless before release time?",
    options: {
      A: "A public QR code",
      B: "Timed key reconstruction with threshold shares",
      C: "A longer exam duration",
      D: "Manual invigilation only",
    },
    correct: "B",
    difficulty: 0.42,
    subject_area: "Security",
    hash: "0xf2a44e7b6e20c6fc31dc48b0219e85f18d4a07d9db9c9d2a76f92f630cbfb108",
  },
  {
    id: "q-agent-02",
    text: "An integrity agent sees two students answer ten questions in the same sequence with nearly identical timing. What should it do first?",
    options: {
      A: "Auto-fail both students immediately",
      B: "Open a correlated-risk flag and keep collecting evidence",
      C: "Ignore timing data",
      D: "Release the answer key",
    },
    correct: "B",
    difficulty: 0.55,
    subject_area: "Agentic AI",
    hash: "0x7ffddf1b42cfd3af27dd0a80953e6a9d520605acf6825bce6a1bd9c77dc67f2a",
  },
  {
    id: "q-chain-03",
    text: "Why is a Merkle root stored on-chain instead of every full question?",
    options: {
      A: "It proves integrity without exposing private content",
      B: "It makes encryption unnecessary",
      C: "It lets students edit answers later",
      D: "It avoids all authentication",
    },
    correct: "A",
    difficulty: 0.5,
    subject_area: "Blockchain",
    hash: "0xa963a8d5ed0ce16b061777870b0be629c51b044f96c97bbd3bc807491a45a34c",
  },
  {
    id: "q-vc-04",
    text: "What makes a verifiable credential useful after the exam is over?",
    options: {
      A: "It can be verified independently by anyone with the proof",
      B: "It hides the final score from the student",
      C: "It depends on one admin password",
      D: "It removes the audit trail",
    },
    correct: "A",
    difficulty: 0.47,
    subject_area: "Credentials",
    hash: "0x67d9ec0fb8271c0fcd1928b5e8de2418a29a954c706ed61ca2e3dfd6d2c8e721",
  },
];

export const DEMO_AGENT_EVENTS = [
  { time: "00:04", agent: "QuestionVault", message: "Merkle root matched. Timed release authorized.", severity: "INFO" },
  { time: "00:19", agent: "AdaptiveSelector", message: "IRT theta initialized. First item selected at difficulty 0.42.", severity: "INFO" },
  { time: "00:31", agent: "EnvironmentAuditor", message: "Focus loss detected. Environment score reduced to 0.92.", severity: "WARNING" },
  { time: "00:52", agent: "IntegrityMonitor", message: "Answer cadence normal. No collusion pattern detected.", severity: "INFO" },
  { time: "01:18", agent: "ResultCertifier", message: "Standing by for completion and clearance.", severity: "INFO" },
];

export const DEMO_RESULT = {
  student_name: "Demo Candidate",
  student_did: "did:examchain:8ac1f4d96e7d40b72f8478a11e9b2e68",
  exam_title: DEMO_EXAM.title,
  score: 100,
  total_marks: 100,
  percentage: 100,
  is_flagged: false,
  vc_hash: "0x3d3e7d986f9354b993b2a2a6df7e7c638df3d16a90a5b5900f5a5f22aa01f8b7",
  chain_tx: "0x91a2c661d8b0bcb0d1434f9f92c7c10d6a09b9d1f3b5e90718f4e8307af6cf21",
  qr_data:
    "http://localhost:5173/verify?did=did:examchain:8ac1f4d96e7d40b72f8478a11e9b2e68&exam=demo-neet-2026&hash=0x3d3e7d986f9354b993b2a2a6df7e7c638df3d16a90a5b5900f5a5f22aa01f8b7",
};
