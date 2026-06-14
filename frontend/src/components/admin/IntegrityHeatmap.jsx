export default function IntegrityHeatmap({ sessions = defaultSessions }) {
  return (
    <section style={panel}>
      <div style={sectionTitle}>SESSION INTEGRITY HEATMAP</div>
      <div style={grid}>
        {sessions.map((session) => (
          <div key={session.id} title={`${session.id}: ${session.risk}% risk`} style={cell(session.risk)}>
            <span>{session.risk}</span>
          </div>
        ))}
      </div>
      <div style={legend}>
        <span>Clean</span>
        <span>Review</span>
        <span>Critical</span>
      </div>
    </section>
  );
}

const defaultSessions = [
  { id: "stu-001", risk: 12 }, { id: "stu-002", risk: 31 }, { id: "stu-003", risk: 74 },
  { id: "stu-004", risk: 18 }, { id: "stu-005", risk: 42 }, { id: "stu-006", risk: 91 },
  { id: "stu-007", risk: 22 }, { id: "stu-008", risk: 8 }, { id: "stu-009", risk: 57 },
  { id: "stu-010", risk: 15 }, { id: "stu-011", risk: 36 }, { id: "stu-012", risk: 69 },
];

const panel = { background: "#0D1117", border: "1px solid #1E293B", borderRadius: 10, padding: "1rem" };
const sectionTitle = { color: "#334155", fontSize: 10, fontFamily: "monospace", letterSpacing: 2, marginBottom: 12 };
const grid = { display: "grid", gridTemplateColumns: "repeat(6, minmax(34px, 1fr))", gap: 8 };
const cell = (risk) => ({ aspectRatio: "1", borderRadius: 6, display: "grid", placeItems: "center", fontFamily: "monospace", fontSize: 10, color: "#F8FAFC", background: risk >= 70 ? "#EF4444" : risk >= 40 ? "#F59E0B" : "#10B981", opacity: 0.35 + Math.min(0.65, risk / 100) });
const legend = { display: "flex", justifyContent: "space-between", color: "#475569", fontSize: 10, marginTop: 10, fontFamily: "monospace" };
