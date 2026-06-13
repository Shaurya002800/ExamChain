import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/shared/Navbar";

const BOOT_LINES = [
  "> Initializing ExamChain v1.0.0...",
  "> Connecting to Ganache blockchain [port 8545]",
  "> QuestionVault contract: 0xe78A0F7E598Cc8b0Bb87894B0F60dD2a88d6a8Ab",
  "> Shamir Secret Sharing: 3-of-5 threshold active",
  "> Agent 1 [IntegrityMonitor]    — ONLINE",
  "> Agent 2 [AdaptiveSelector]    — ONLINE",
  "> Agent 3 [EnvironmentAuditor]  — ONLINE",
  "> Agent 4 [ResultCertifier]     — ONLINE",
  "> Zero-trust layer: ACTIVE",
  "> System ready. Paper leak probability: 0.000%",
];

const STATS = [
  { value: "2.27M",  label: "Students affected by NEET 2026 cancellation" },
  { value: "3",      label: "Consecutive years of paper leaks" },
  { value: "0",      label: "Humans who can decrypt the paper early" },
  { value: "100%",   label: "Actions logged immutably on-chain" },
];

export default function Landing() {
  const navigate = useNavigate();
  const [visibleLines, setVisibleLines] = useState([]);
  const [bootDone, setBootDone] = useState(false);
  const [chainBlocks, setChainBlocks] = useState([]);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i < BOOT_LINES.length) {
        setVisibleLines(prev => [...prev, BOOT_LINES[i]]);
        i++;
      } else {
        clearInterval(interval);
        setTimeout(() => setBootDone(true), 400);
      }
    }, 180);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!bootDone) return;
    const blocks = [
      { label: "EXAM_CREATED",    hash: "0x8ed5996d...", color: "#0EA5E9" },
      { label: "PAPER_LOCKED",    hash: "0x1c2d6bbf...", color: "#10B981" },
      { label: "SESSION_STARTED", hash: "0x4b5c7e10...", color: "#0EA5E9" },
      { label: "RESULT_CERTIFIED",hash: "0x647185b0...", color: "#10B981" },
    ];
    let i = 0;
    const iv = setInterval(() => {
      if (i < blocks.length) { setChainBlocks(prev => [...prev, blocks[i]]); i++; }
      else clearInterval(iv);
    }, 400);
    return () => clearInterval(iv);
  }, [bootDone]);

  return (
    <div style={{ minHeight: "100vh", background: "#0A0F1E", fontFamily: "Inter, sans-serif" }}>
      <Navbar />

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "4rem 2rem" }}>

        {/* Terminal Boot */}
        <div style={{
          background: "#0D1117",
          border: "1px solid #1E293B",
          borderRadius: 12,
          padding: "1.5rem",
          marginBottom: "3rem",
          fontFamily: "JetBrains Mono, monospace",
          fontSize: 13,
          lineHeight: 1.8,
        }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
            {["#FF5F56","#FFBD2E","#27C93F"].map((c,i) => (
              <div key={i} style={{ width: 12, height: 12, borderRadius: "50%", background: c }} />
            ))}
            <span style={{ color: "#475569", fontSize: 11, marginLeft: 8 }}>examchain — system boot</span>
          </div>
          {visibleLines.map((line, i) => (
            <div key={i} style={{
              color: line.includes("ONLINE") ? "#10B981" :
                     line.includes("0.000%") ? "#F59E0B" : "#94A3B8",
              animation: "fade-in 0.3s ease"
            }}>{line}</div>
          ))}
          {!bootDone && (
            <span style={{ color: "#0EA5E9", animation: "pulse 1s infinite" }}>█</span>
          )}
        </div>

        {/* Hero */}
        {bootDone && (
          <div style={{ animation: "fade-in 0.6s ease" }}>
            <div style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: "clamp(2.2rem, 5vw, 3.8rem)",
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: "-1.5px",
              marginBottom: "1.5rem",
              color: "#F1F5F9",
            }}>
              The paper doesn't exist<br />
              <span style={{ color: "#0EA5E9" }}>until the exam starts.</span>
            </div>

            <p style={{
              color: "#64748B", fontSize: 17, maxWidth: 560,
              lineHeight: 1.7, marginBottom: "2.5rem"
            }}>
              ExamChain rebuilds the trust architecture of examinations.
              Shamir's Secret Sharing. Autonomous AI agents. Immutable
              blockchain audit trail. No single human can leak the paper.
            </p>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: "4rem" }}>
              <button onClick={() => navigate("/student")} style={btnPrimary}>
                Enter as Student →
              </button>
              <button onClick={() => navigate("/examiner")} style={btnSecondary}>
                Examiner Portal
              </button>
              <button onClick={() => navigate("/admin")} style={btnSecondary}>
                Admin Dashboard
              </button>
              <button onClick={() => navigate("/verify")} style={{ ...btnSecondary, color: "#10B981", borderColor: "#10B981" }}>
                Verify Credential ↗
              </button>
            </div>

            {/* Stats */}
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 16, marginBottom: "4rem"
            }}>
              {STATS.map((s, i) => (
                <div key={i} style={{
                  background: "#0D1117",
                  border: "1px solid #1E293B",
                  borderLeft: "3px solid #0EA5E9",
                  borderRadius: 8,
                  padding: "1.2rem 1.4rem",
                }}>
                  <div style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: "2rem", fontWeight: 800,
                    color: i === 0 || i === 1 ? "#F59E0B" : "#10B981",
                    letterSpacing: "-1px"
                  }}>{s.value}</div>
                  <div style={{ color: "#64748B", fontSize: 12, lineHeight: 1.5, marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Live Chain */}
            <div style={{ marginBottom: "4rem" }}>
              <div style={{ color: "#475569", fontSize: 11, fontFamily: "monospace", marginBottom: 12, letterSpacing: 2 }}>
                LIVE AUDIT CHAIN — IMMUTABLE ON-CHAIN EVENTS
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 0, flexWrap: "wrap" }}>
                {chainBlocks.map((block, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center" }}>
                    <div style={{
                      background: "#0D1117",
                      border: `1px solid ${block.color}`,
                      borderRadius: 8,
                      padding: "10px 14px",
                      animation: "fade-in 0.4s ease",
                      minWidth: 160,
                    }}>
                      <div style={{ color: block.color, fontSize: 10, fontFamily: "monospace", fontWeight: 700, marginBottom: 4 }}>
                        {block.label}
                      </div>
                      <div style={{ color: "#475569", fontSize: 10, fontFamily: "monospace" }}>
                        {block.hash}
                      </div>
                    </div>
                    {i < chainBlocks.length - 1 && (
                      <div style={{ width: 24, height: 1, background: "#1E293B", position: "relative" }}>
                        <div style={{ position: "absolute", top: -3, right: 0, color: "#1E293B", fontSize: 8 }}>▶</div>
                      </div>
                    )}
                  </div>
                ))}
                {chainBlocks.length > 0 && chainBlocks.length < 4 && (
                  <div style={{ width: 30, height: 1, background: "#1E293B", marginLeft: 0 }} />
                )}
              </div>
            </div>

            {/* How it works */}
            <div style={{ borderTop: "1px solid #1E293B", paddingTop: "3rem" }}>
              <div style={{ color: "#475569", fontSize: 11, fontFamily: "monospace", marginBottom: 24, letterSpacing: 2 }}>
                HOW THE ZERO-TRUST LAYER WORKS
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
                {[
                  { step: "01", title: "Questions Encrypted", desc: "AES-256 encryption. Key split via Shamir's Secret Sharing across 5 parties. 3-of-5 needed to decrypt.", color: "#0EA5E9" },
                  { step: "02", title: "Smart Contract Lock", desc: "Timed release contract on Ganache. Paper mathematically impossible to read before exam start.", color: "#0EA5E9" },
                  { step: "03", title: "4 AI Agents Active", desc: "Integrity Monitor, Adaptive Selector, Environment Auditor, Result Certifier — all autonomous.", color: "#10B981" },
                  { step: "04", title: "Result On-Chain", desc: "W3C Verifiable Credential issued. QR code generated. Tamper-proof forever.", color: "#10B981" },
                ].map((item, i) => (
                  <div key={i} style={{
                    background: "#0D1117",
                    border: "1px solid #1E293B",
                    borderRadius: 8,
                    padding: "1.4rem",
                  }}>
                    <div style={{ fontFamily: "monospace", fontSize: 10, color: item.color, marginBottom: 10, letterSpacing: 2 }}>
                      STEP {item.step}
                    </div>
                    <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15, color: "#F1F5F9", marginBottom: 8 }}>
                      {item.title}
                    </div>
                    <div style={{ color: "#64748B", fontSize: 13, lineHeight: 1.6 }}>
                      {item.desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const btnPrimary = {
  background: "#0EA5E9",
  color: "#fff",
  border: "none",
  padding: "12px 24px",
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "Inter, sans-serif",
  letterSpacing: "-0.2px",
};

const btnSecondary = {
  background: "transparent",
  color: "#94A3B8",
  border: "1px solid #1E293B",
  padding: "12px 24px",
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 500,
  cursor: "pointer",
  fontFamily: "Inter, sans-serif",
};