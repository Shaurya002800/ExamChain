import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/shared/Navbar";

const BOOT = [
  { text: "> Initializing ExamChain v1.0.0...", color: "#94A3B8" },
  { text: "> Blockchain connected [port 8545]", color: "#94A3B8" },
  { text: "> QuestionVault: DEPLOYED", color: "#94A3B8" },
  { text: "> Shamir 3-of-5 threshold: ACTIVE", color: "#94A3B8" },
  { text: "> Agent 1 IntegrityMonitor ONLINE", color: "#10B981" },
  { text: "> Agent 2 AdaptiveSelector ONLINE", color: "#10B981" },
  { text: "> Agent 3 EnvironmentAuditor ONLINE", color: "#10B981" },
  { text: "> Agent 4 ResultCertifier ONLINE", color: "#10B981" },
  { text: "> Paper leak probability: 0.000%", color: "#F59E0B" },
  { text: "> System ready.", color: "#0EA5E9" },
];

export default function Landing() {
  const navigate = useNavigate();
  const [lines, setLines] = useState([]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let i = 0;
    const iv = setInterval(() => {
      if (i < BOOT.length) {
        const item = BOOT[i];
        setLines(p => [...p, item]);
        i++;
      } else {
        clearInterval(iv);
        setTimeout(() => setDone(true), 300);
      }
    }, 150);
    return () => clearInterval(iv);
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#0A0F1E", fontFamily: "Inter, sans-serif" }}>
      <Navbar />
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "3rem 2rem" }}>

        <div style={{ background: "#0D1117", border: "1px solid #1E293B", borderRadius: 10, padding: "1.25rem 1.5rem", marginBottom: "3rem", fontFamily: "monospace", fontSize: 12.5, lineHeight: 1.9 }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
            <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#FF5F56" }} />
            <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#FFBD2E" }} />
            <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#27C93F" }} />
            <span style={{ color: "#334155", fontSize: 10.5, marginLeft: 6 }}>examchain — boot</span>
          </div>
          {lines.map(function(l, i) { return <div key={i} style={{ color: l.color }}>{l.text}</div>; })}
          {!done && <span style={{ color: "#0EA5E9" }}>█</span>}
        </div>

        {done && (
          <div>
            <div style={{ fontFamily: "sans-serif", fontSize: "clamp(2rem, 5vw, 3.6rem)", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-1.5px", color: "#F1F5F9", marginBottom: "1.25rem" }}>
              The paper does not exist<br />
              <span style={{ color: "#0EA5E9" }}>until the exam starts.</span>
            </div>

            <p style={{ color: "#64748B", fontSize: 16, maxWidth: 540, lineHeight: 1.75, marginBottom: "2rem" }}>
              ExamChain rebuilds examination trust from scratch. Shamir Secret Sharing. Autonomous AI agents. Immutable blockchain audit trail. No single human can leak the paper.
            </p>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: "3.5rem" }}>
              <button onClick={function(){ navigate("/student"); }} style={{ padding: "11px 22px", borderRadius: 7, fontSize: 13.5, fontWeight: 600, cursor: "pointer", background: "#0EA5E9", color: "#fff", border: "none" }}>Enter as Student</button>
              <button onClick={function(){ navigate("/examiner"); }} style={{ padding: "11px 22px", borderRadius: 7, fontSize: 13.5, fontWeight: 500, cursor: "pointer", background: "transparent", color: "#94A3B8", border: "1px solid #1E293B" }}>Examiner Portal</button>
              <button onClick={function(){ navigate("/admin"); }} style={{ padding: "11px 22px", borderRadius: 7, fontSize: 13.5, fontWeight: 500, cursor: "pointer", background: "transparent", color: "#94A3B8", border: "1px solid #1E293B" }}>Admin Dashboard</button>
              <button onClick={function(){ navigate("/verify"); }} style={{ padding: "11px 22px", borderRadius: 7, fontSize: 13.5, fontWeight: 500, cursor: "pointer", background: "transparent", color: "#10B981", border: "1px solid #10B981" }}>Verify Credential</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 14, marginBottom: "3.5rem" }}>
              <div style={{ background: "#0D1117", border: "1px solid #1E293B", borderLeft: "3px solid #F59E0B", borderRadius: 8, padding: "1.1rem 1.3rem" }}>
                <div style={{ fontSize: "1.9rem", fontWeight: 800, color: "#F59E0B" }}>2.27M</div>
                <div style={{ color: "#475569", fontSize: 12, marginTop: 5 }}>Students affected by NEET 2026</div>
              </div>
              <div style={{ background: "#0D1117", border: "1px solid #1E293B", borderLeft: "3px solid #F59E0B", borderRadius: 8, padding: "1.1rem 1.3rem" }}>
                <div style={{ fontSize: "1.9rem", fontWeight: 800, color: "#F59E0B" }}>3</div>
                <div style={{ color: "#475569", fontSize: 12, marginTop: 5 }}>Consecutive years of paper leaks</div>
              </div>
              <div style={{ background: "#0D1117", border: "1px solid #1E293B", borderLeft: "3px solid #10B981", borderRadius: 8, padding: "1.1rem 1.3rem" }}>
                <div style={{ fontSize: "1.9rem", fontWeight: 800, color: "#10B981" }}>0</div>
                <div style={{ color: "#475569", fontSize: 12, marginTop: 5 }}>Humans who can decrypt early</div>
              </div>
              <div style={{ background: "#0D1117", border: "1px solid #1E293B", borderLeft: "3px solid #10B981", borderRadius: 8, padding: "1.1rem 1.3rem" }}>
                <div style={{ fontSize: "1.9rem", fontWeight: 800, color: "#10B981" }}>100%</div>
                <div style={{ color: "#475569", fontSize: 12, marginTop: 5 }}>Actions logged on-chain</div>
              </div>
            </div>

            <div style={{ borderTop: "1px solid #1E293B", paddingTop: "2.5rem" }}>
              <div style={{ color: "#334155", fontSize: 10, fontFamily: "monospace", letterSpacing: 2, marginBottom: 20 }}>HOW THE ZERO-TRUST LAYER WORKS</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
                <div style={{ background: "#0D1117", border: "1px solid #1E293B", borderRadius: 8, padding: "1.3rem" }}>
                  <div style={{ fontFamily: "monospace", fontSize: 9.5, color: "#0EA5E9", marginBottom: 9, letterSpacing: 2 }}>STEP 01</div>
                  <div style={{ fontWeight: 700, fontSize: 14.5, color: "#F1F5F9", marginBottom: 7 }}>Questions Encrypted</div>
                  <div style={{ color: "#475569", fontSize: 12.5, lineHeight: 1.65 }}>AES-256 encryption. Key split via Shamir Secret Sharing. No single person holds the full key.</div>
                </div>
                <div style={{ background: "#0D1117", border: "1px solid #1E293B", borderRadius: 8, padding: "1.3rem" }}>
                  <div style={{ fontFamily: "monospace", fontSize: 9.5, color: "#0EA5E9", marginBottom: 9, letterSpacing: 2 }}>STEP 02</div>
                  <div style={{ fontWeight: 700, fontSize: 14.5, color: "#F1F5F9", marginBottom: 7 }}>Smart Contract Lock</div>
                  <div style={{ color: "#475569", fontSize: 12.5, lineHeight: 1.65 }}>Timed release on Ganache. Paper is mathematically unreadable before exam start time.</div>
                </div>
                <div style={{ background: "#0D1117", border: "1px solid #1E293B", borderRadius: 8, padding: "1.3rem" }}>
                  <div style={{ fontFamily: "monospace", fontSize: 9.5, color: "#10B981", marginBottom: 9, letterSpacing: 2 }}>STEP 03</div>
                  <div style={{ fontWeight: 700, fontSize: 14.5, color: "#F1F5F9", marginBottom: 7 }}>4 AI Agents Active</div>
                  <div style={{ color: "#475569", fontSize: 12.5, lineHeight: 1.65 }}>Integrity Monitor, Adaptive Selector, Environment Auditor, Result Certifier — all autonomous.</div>
                </div>
                <div style={{ background: "#0D1117", border: "1px solid #1E293B", borderRadius: 8, padding: "1.3rem" }}>
                  <div style={{ fontFamily: "monospace", fontSize: 9.5, color: "#10B981", marginBottom: 9, letterSpacing: 2 }}>STEP 04</div>
                  <div style={{ fontWeight: 700, fontSize: 14.5, color: "#F1F5F9", marginBottom: 7 }}>Result On-Chain</div>
                  <div style={{ color: "#475569", fontSize: 12.5, lineHeight: 1.65 }}>W3C Verifiable Credential issued. QR code. Tamper-proof forever. No NTA dependency.</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
