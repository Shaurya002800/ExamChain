export default function AgentEventFeed({ events = [], title = "LIVE AGENT FEED" }) {
  return (
    <section style={panel}>
      <div style={sectionTitle}>{title}</div>
      <div style={{ display: "grid", gap: 9 }}>
        {events.length === 0 ? (
          <div style={empty}>No agent events yet.</div>
        ) : events.map((event, i) => (
          <div key={`${event.time}-${event.agent}-${i}`} style={eventRow(event.severity)}>
            <div style={rowTop}>
              <span style={agentName}>{event.agent}</span>
              <span style={eventTime}>{event.time}</span>
            </div>
            <div style={message}>{event.message}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

const panel = { background: "#0D1117", border: "1px solid #1E293B", borderRadius: 8, padding: "1.25rem" };
const sectionTitle = { color: "#334155", fontSize: 10, fontFamily: "monospace", letterSpacing: 2, marginBottom: 12 };
const empty = { color: "#475569", fontSize: 12, fontFamily: "monospace" };
const rowTop = { display: "flex", justifyContent: "space-between", gap: 8 };
const agentName = { color: "#F1F5F9", fontFamily: "monospace", fontSize: 11 };
const eventTime = { color: "#334155", fontFamily: "monospace", fontSize: 10 };
const message = { color: "#64748B", fontSize: 12, lineHeight: 1.45, marginTop: 3 };
const eventRow = (severity) => ({
  borderLeft: `3px solid ${severity === "WARNING" || severity === "CRITICAL" ? "#F59E0B" : "#10B981"}`,
  paddingLeft: 10,
});
