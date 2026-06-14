export default function CheatRingGraph({ flags = [] }) {
  const grouped = flags.length ? flags : defaultFlags;

  return (
    <section style={panel}>
      <div style={sectionTitle}>CORRELATED RISK GRAPH</div>
      <div style={graph}>
        {grouped.map((flag, i) => (
          <div key={`${flag.session_id}-${i}`} style={node(i, flag.severity)}>
            <div style={nodeTitle}>{flag.session_id}</div>
            <div style={nodeSub}>{flag.event_type}</div>
          </div>
        ))}
      </div>
      <div style={copy}>Pairs with similar timing or answer order are elevated for human review, not auto-failed.</div>
    </section>
  );
}

const defaultFlags = [
  { session_id: "4b5c7e10", event_type: "ANSWER_TIMING", severity: "CRITICAL" },
  { session_id: "d92776af", event_type: "TAB_SWITCH", severity: "WARNING" },
  { session_id: "a1b2c3d4", event_type: "BIOMETRIC_DRIFT", severity: "WARNING" },
];

const panel = { background: "#0D1117", border: "1px solid #1E293B", borderRadius: 10, padding: "1rem" };
const sectionTitle = { color: "#334155", fontSize: 10, fontFamily: "monospace", letterSpacing: 2, marginBottom: 12 };
const graph = { minHeight: 150, position: "relative", border: "1px dashed #1E293B", borderRadius: 8, background: "#0A0F1E" };
const node = (index, severity) => ({ position: "absolute", left: `${12 + (index % 3) * 32}%`, top: `${22 + (index % 2) * 34}%`, width: 132, padding: "10px", borderRadius: 8, border: `1px solid ${severity === "CRITICAL" ? "#EF4444" : "#F59E0B"}`, background: severity === "CRITICAL" ? "#EF444420" : "#F59E0B20" });
const nodeTitle = { color: "#F1F5F9", fontFamily: "monospace", fontSize: 11, fontWeight: 800 };
const nodeSub = { color: "#94A3B8", fontFamily: "monospace", fontSize: 9, marginTop: 4 };
const copy = { color: "#64748B", fontSize: 12, lineHeight: 1.45, marginTop: 12 };
