import { useState, useEffect } from "react";
import Navbar from "../components/shared/Navbar";
import BlockchainExplorer from "../components/admin/BlockchainExplorer";
import CheatRingGraph from "../components/admin/CheatRingGraph";
import IntegrityHeatmap from "../components/admin/IntegrityHeatmap";
import { blockchainStatus, recentTransactions } from "../services/api";
import { DEMO_EXAM } from "../data/demo";

export default function AdminDashboard() {
  const [chain, setChain]   = useState(null);
  const [txns, setTxns]     = useState([]);
  const [tab, setTab]       = useState("blockchain");
  const [loading, setLoading] = useState(true);

  const MOCK_FLAGS = [
    { session_id: "4b5c7e10...", student_id: "stu_001", agent: "INTEGRITY_MONITOR", event_type: "IDENTICAL_ANSWER_TIMING", severity: "CRITICAL", timestamp: "2026-06-13T06:01:12Z" },
    { session_id: "d92776af...", student_id: "stu_002", agent: "ENVIRONMENT_AUDITOR", event_type: "TAB_SWITCH", severity: "WARNING", timestamp: "2026-06-13T06:02:44Z" },
    { session_id: "a1b2c3d4...", student_id: "stu_003", agent: "BEHAVIORAL_AUTH", event_type: "ANOMALY_DETECTED", severity: "WARNING", timestamp: "2026-06-13T06:03:30Z" },
  ];

  async function loadData() {
    setLoading(true);
    try {
      const [c, t] = await Promise.all([blockchainStatus(), recentTransactions()]);
      setChain(c.data);
      setTxns(t.data.transactions || []);
    } catch {
      setChain({
        connected: true,
        block_number: 128,
        network_id: 1337,
        deployer: "0x90f8bf6a479f320ead074411a4b0e7944ea8c9c1",
      });
      setTxns([
        { tx_hash: DEMO_EXAM.vault_tx_hash, block: 124, from: "0x90f8bf6a479f320ead074411a4b0e7944ea8c9c1", gas_used: 221456 },
        { tx_hash: "0x91a2c661d8b0bcb0d1434f9f92c7c10d6a09b9d1f3b5e90718f4e8307af6cf21", block: 128, from: "0x90f8bf6a479f320ead074411a4b0e7944ea8c9c1", gas_used: 183902 },
      ]);
    }
    setLoading(false);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => loadData(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const tabs = [
    ["blockchain", "Blockchain Explorer"],
    ["agents",     "Agent Feed"],
    ["flags",      "Integrity Flags"],
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#0A0F1E", fontFamily: "Inter, sans-serif" }}>
      <Navbar />
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "2.5rem 2rem" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
          <div>
            <div style={{ fontFamily: "monospace", fontSize: 10, color: "#0EA5E9", letterSpacing: 2, marginBottom: 8 }}>ADMIN DASHBOARD</div>
            <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#F1F5F9" }}>ExamChain Control Center</div>
          </div>
          {chain && (
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ background: "#0D1117", border: "1px solid #10B981", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ color: "#10B981", fontSize: 10, fontFamily: "monospace", letterSpacing: 1 }}>CHAIN</div>
                <div style={{ color: "#F1F5F9", fontWeight: 700, fontSize: 13 }}>{chain.connected ? "LIVE" : "DOWN"}</div>
              </div>
              <div style={{ background: "#0D1117", border: "1px solid #1E293B", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ color: "#475569", fontSize: 10, fontFamily: "monospace", letterSpacing: 1 }}>BLOCK</div>
                <div style={{ color: "#F1F5F9", fontWeight: 700, fontSize: 13 }}>#{chain.block_number}</div>
              </div>
              <div style={{ background: "#0D1117", border: "1px solid #1E293B", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ color: "#475569", fontSize: 10, fontFamily: "monospace", letterSpacing: 1 }}>CHAIN ID</div>
                <div style={{ color: "#F1F5F9", fontWeight: 700, fontSize: 13 }}>{chain.network_id}</div>
              </div>
            </div>
          )}
        </div>

        {/* Tab Nav */}
        <div style={{ display: "flex", gap: 8, marginBottom: "2rem", borderBottom: "1px solid #1E293B", paddingBottom: "1rem" }}>
          {tabs.map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: "8px 16px", border: "none", cursor: "pointer",
              background: tab === t ? "#0EA5E920" : "transparent",
              color: tab === t ? "#0EA5E9" : "#475569",
              fontSize: 13, fontWeight: tab === t ? 600 : 400,
              fontFamily: "Inter, sans-serif",
              borderBottom: tab === t ? "2px solid #0EA5E9" : "2px solid transparent",
              borderRadius: 0, paddingLeft: 0, paddingRight: 20,
            }}>{label}</button>
          ))}
        </div>

        {/* Blockchain Explorer */}
        {tab === "blockchain" && (
          <BlockchainExplorer chain={chain} transactions={txns} loading={loading} />
        )}

        {/* Agent Feed */}
        {tab === "agents" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: "2rem" }}>
              {[
                { name: "INTEGRITY MONITOR",    status: "ACTIVE", events: 3,  color: "#0EA5E9" },
                { name: "ADAPTIVE SELECTOR",    status: "ACTIVE", events: 12, color: "#10B981" },
                { name: "ENVIRONMENT AUDITOR",  status: "ACTIVE", events: 1,  color: "#F59E0B" },
                { name: "RESULT CERTIFIER",     status: "STANDBY",events: 0,  color: "#64748B" },
              ].map((agent, i) => (
                <div key={i} style={{ background: "#0D1117", border: "1px solid #1E293B", borderRadius: 10, padding: "1.25rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div style={{ fontFamily: "monospace", fontSize: 9.5, color: agent.color, letterSpacing: 1 }}>{agent.name}</div>
                    <span style={{
                      padding: "3px 8px", borderRadius: 20, fontSize: 9, fontFamily: "monospace",
                      background: agent.status === "ACTIVE" ? "#10B98120" : "#1E293B",
                      color: agent.status === "ACTIVE" ? "#10B981" : "#475569",
                    }}>{agent.status}</span>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: "1.6rem", color: "#F1F5F9", letterSpacing: "-0.5px" }}>{agent.events}</div>
                  <div style={{ color: "#475569", fontSize: 11, marginTop: 2 }}>events fired</div>
                  <div style={{ marginTop: 12, height: 3, background: "#1E293B", borderRadius: 2 }}>
                    <div style={{ height: "100%", width: agent.status === "ACTIVE" ? "100%" : "0%", background: agent.color, borderRadius: 2, transition: "width 1s" }} />
                  </div>
                </div>
              ))}
            </div>

            <div style={{ fontFamily: "monospace", fontSize: 10, color: "#334155", letterSpacing: 2, marginBottom: 12 }}>LIVE EVENT LOG</div>
            <div style={{ background: "#0D1117", border: "1px solid #1E293B", borderRadius: 10, padding: "1rem", fontFamily: "monospace", fontSize: 11 }}>
              {[
                { time: "06:01:12", agent: "INTEGRITY", msg: "Cross-session correlation check — 45 sessions monitored", color: "#0EA5E9" },
                { time: "06:01:44", agent: "ADAPTIVE",  msg: "IRT theta updated for session 4b5c — θ=0.342", color: "#10B981" },
                { time: "06:02:10", agent: "INTEGRITY", msg: "FLAG: identical answer pattern detected — sessions 4b5c, d927", color: "#EF4444" },
                { time: "06:02:44", agent: "ENVIRON",   msg: "Tab switch detected — session d927 risk: 0.87", color: "#F59E0B" },
                { time: "06:03:12", agent: "CERTIFIER", msg: "Awaiting session completions...", color: "#64748B" },
                { time: "06:03:57", agent: "CERTIFIER", msg: "Result certified — TX: 0x647185b0... VC issued", color: "#10B981" },
              ].map((log, i) => (
                <div key={i} style={{ display: "flex", gap: 12, padding: "6px 0", borderBottom: "1px solid #0F172A" }}>
                  <span style={{ color: "#334155", minWidth: 60 }}>{log.time}</span>
                  <span style={{ color: log.color, minWidth: 80 }}>[{log.agent}]</span>
                  <span style={{ color: "#64748B" }}>{log.msg}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Integrity Flags */}
        {tab === "flags" && (
          <div>
            <div style={{ display: "flex", gap: 12, marginBottom: "1.5rem" }}>
              {[
                { label: "CRITICAL FLAGS", value: 1, color: "#EF4444" },
                { label: "WARNINGS",       value: 2, color: "#F59E0B" },
                { label: "SESSIONS CLEAN", value: 42, color: "#10B981" },
              ].map((s, i) => (
                <div key={i} style={{ background: "#0D1117", border: "1px solid #1E293B", borderRadius: 8, padding: "0.9rem 1.2rem", flex: 1 }}>
                  <div style={{ fontFamily: "monospace", fontSize: 9.5, color: "#334155", letterSpacing: 1, marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontSize: "1.8rem", fontWeight: 800, color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12, marginBottom: "1.5rem" }}>
              <IntegrityHeatmap />
              <CheatRingGraph flags={MOCK_FLAGS} />
            </div>

            <div style={{ fontFamily: "monospace", fontSize: 10, color: "#334155", letterSpacing: 2, marginBottom: 12 }}>FLAGGED SESSIONS</div>
            <div style={{ display: "grid", gap: 8 }}>
              {MOCK_FLAGS.map((flag, i) => (
                <div key={i} style={{
                  background: "#0D1117",
                  border: "1px solid " + (flag.severity === "CRITICAL" ? "#EF444440" : "#F59E0B40"),
                  borderLeft: "3px solid " + (flag.severity === "CRITICAL" ? "#EF4444" : "#F59E0B"),
                  borderRadius: 8, padding: "1rem 1.25rem",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{
                        padding: "3px 8px", borderRadius: 4, fontSize: 9, fontFamily: "monospace", fontWeight: 700,
                        background: flag.severity === "CRITICAL" ? "#EF444420" : "#F59E0B20",
                        color: flag.severity === "CRITICAL" ? "#EF4444" : "#F59E0B",
                      }}>{flag.severity}</span>
                      <span style={{ fontFamily: "monospace", fontSize: 11, color: "#64748B" }}>{flag.event_type}</span>
                    </div>
                    <span style={{ fontFamily: "monospace", fontSize: 10, color: "#334155" }}>{new Date(flag.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div style={{ display: "flex", gap: 16 }}>
                    <div style={{ fontFamily: "monospace", fontSize: 10, color: "#475569" }}>
                      SESSION: <span style={{ color: "#0EA5E9" }}>{flag.session_id}</span>
                    </div>
                    <div style={{ fontFamily: "monospace", fontSize: 10, color: "#475569" }}>
                      AGENT: <span style={{ color: "#64748B" }}>{flag.agent}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
