export default function IntegrityFeed({ agents = defaultAgents, logs = defaultLogs }) {
  return (
    <div>
      <div style={grid}>
        {agents.map((agent) => (
          <div key={agent.name} style={card}>
            <div style={top}>
              <div style={{ ...agentName, color: agent.color }}>{agent.name}</div>
              <span style={status(agent.status)}>{agent.status}</span>
            </div>
            <div style={count}>{agent.events}</div>
            <div style={sub}>events fired</div>
            <div style={bar}>
              <div style={{ ...barFill, width: agent.status === "ACTIVE" ? "100%" : "20%", background: agent.color }} />
            </div>
          </div>
        ))}
      </div>

      <div style={label}>LIVE EVENT LOG</div>
      <div style={terminal}>
        {logs.map((log, i) => (
          <div key={`${log.time}-${i}`} style={logRow}>
            <span style={time}>{log.time}</span>
            <span style={{ ...logAgent, color: log.color }}>[{log.agent}]</span>
            <span style={logMessage}>{log.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const defaultAgents = [
  { name: "INTEGRITY MONITOR", status: "ACTIVE", events: 3, color: "#0EA5E9" },
  { name: "ADAPTIVE SELECTOR", status: "ACTIVE", events: 12, color: "#10B981" },
  { name: "ENVIRONMENT AUDITOR", status: "ACTIVE", events: 1, color: "#F59E0B" },
  { name: "RESULT CERTIFIER", status: "STANDBY", events: 0, color: "#64748B" },
];

const defaultLogs = [
  { time: "06:01:12", agent: "INTEGRITY", msg: "Cross-session correlation check — 45 sessions monitored", color: "#0EA5E9" },
  { time: "06:01:44", agent: "ADAPTIVE", msg: "IRT theta updated for session 4b5c — theta=0.342", color: "#10B981" },
  { time: "06:02:10", agent: "INTEGRITY", msg: "FLAG: identical answer pattern detected — sessions 4b5c, d927", color: "#EF4444" },
  { time: "06:02:44", agent: "ENVIRON", msg: "Tab switch detected — session d927 risk: 0.87", color: "#F59E0B" },
  { time: "06:03:12", agent: "CERTIFIER", msg: "Awaiting session completions...", color: "#64748B" },
  { time: "06:03:57", agent: "CERTIFIER", msg: "Result certified — TX: 0x647185b0... VC issued", color: "#10B981" },
];

const grid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: "2rem" };
const card = { background: "#0D1117", border: "1px solid #1E293B", borderRadius: 10, padding: "1.25rem" };
const top = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 };
const agentName = { fontFamily: "monospace", fontSize: 9.5, letterSpacing: 1 };
const status = (value) => ({ padding: "3px 8px", borderRadius: 20, fontSize: 9, fontFamily: "monospace", background: value === "ACTIVE" ? "#10B98120" : "#1E293B", color: value === "ACTIVE" ? "#10B981" : "#475569" });
const count = { fontWeight: 800, fontSize: "1.6rem", color: "#F1F5F9", letterSpacing: "-0.5px" };
const sub = { color: "#475569", fontSize: 11, marginTop: 2 };
const bar = { marginTop: 12, height: 3, background: "#1E293B", borderRadius: 2 };
const barFill = { height: "100%", borderRadius: 2, transition: "width 1s" };
const label = { fontFamily: "monospace", fontSize: 10, color: "#334155", letterSpacing: 2, marginBottom: 12 };
const terminal = { background: "#0D1117", border: "1px solid #1E293B", borderRadius: 10, padding: "1rem", fontFamily: "monospace", fontSize: 11 };
const logRow = { display: "flex", gap: 12, padding: "6px 0", borderBottom: "1px solid #0F172A" };
const time = { color: "#334155", minWidth: 60 };
const logAgent = { minWidth: 80 };
const logMessage = { color: "#64748B" };
