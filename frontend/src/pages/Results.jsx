import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { CheckCircle2, Clock3, ExternalLink, ShieldCheck } from "lucide-react";
import Navbar from "../components/shared/Navbar";
import useStore from "../store/useStore";
import { DEMO_RESULT } from "../data/demo";
import { getStudentResults } from "../services/api";
import toast from "react-hot-toast";

export default function Results() {
  const { lastResult, user, role, token, setResult } = useStore();
  const [history, setHistory] = useState([]);
  const [selectedResult, setSelectedResult] = useState(null);
  const result = selectedResult || history[0] || lastResult || DEMO_RESULT;
  const isPending = result.status === "PENDING" || !result.vc_hash;
  const verifyUrl = `/verify?did=${encodeURIComponent(result.student_did || "")}&exam=${encodeURIComponent(result.exam_id || "demo-neet-2026")}&hash=${encodeURIComponent(result.vc_hash || "")}`;

  useEffect(() => {
    if (role !== "student" || !user?.student_id || token === "demo-token") return;
    let alive = true;
    getStudentResults(user.student_id)
      .then((res) => {
        if (!alive) return;
        const sorted = [...(res.data || [])].sort((a, b) => {
          if (a.status === "CERTIFIED" && b.status !== "CERTIFIED") return -1;
          if (a.status !== "CERTIFIED" && b.status === "CERTIFIED") return 1;
          return String(b.certified_at || "").localeCompare(String(a.certified_at || ""));
        });
        setHistory(sorted);
        if (sorted[0]) {
          setSelectedResult(sorted[0]);
          setResult(sorted[0]);
        }
      })
      .catch((error) => toast.error(error.response?.data?.detail || "Could not load latest result"))
    return () => { alive = false; };
  }, [role, user?.student_id, token, setResult]);

  return (
    <div style={{ minHeight: "100vh", background: "#0A0F1E", fontFamily: "Inter, sans-serif" }}>
      <Navbar />
      <main style={{ maxWidth: 1000, margin: "0 auto", padding: "3rem 2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 20, alignItems: "flex-end", marginBottom: 24, flexWrap: "wrap" }}>
          <div>
            <div style={eyebrow}>RESULT CERTIFIER</div>
            <h1 style={title}>{isPending ? "Submission waiting for examiner review" : "Credential issued on ExamChain"}</h1>
            <p style={muted}>{isPending ? "Your answers are submitted. The examiner must review the session, then certify or hold the result." : "The result is hashed, bound to the candidate DID, and verifiable without contacting the exam authority."}</p>
          </div>
          {!isPending && <Link to={verifyUrl} style={primaryBtn}><ExternalLink size={16} /> Verify publicly</Link>}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 18 }}>
          <section style={panel}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
              <div style={{ width: 42, height: 42, borderRadius: "50%", background: "#10B98120", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {isPending ? <Clock3 color="#F59E0B" size={24} /> : <CheckCircle2 color="#10B981" size={24} />}
              </div>
              <div>
                <div style={{ color: isPending ? "#F59E0B" : "#10B981", fontWeight: 850 }}>{isPending ? "PENDING REVIEW" : "CERTIFIED"}</div>
                <div style={{ color: "#64748B", fontSize: 13 }}>{isPending ? result.message : result.is_flagged ? "Review completed with integrity flag" : "No critical integrity flags"}</div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 22 }}>
              <Metric label="Candidate" value={result.student_name} />
              <Metric label="Score" value={`${result.score} / ${result.total_marks}`} />
              <Metric label="Percentage" value={isPending ? "Pending" : `${result.percentage}%`} />
              <Metric label="Status" value={isPending ? "PENDING" : result.is_flagged ? "FLAGGED" : "VERIFIED"} color={isPending ? "#F59E0B" : result.is_flagged ? "#F59E0B" : "#10B981"} />
            </div>

            {result.student_did && <Proof label="Student DID" value={result.student_did} />}
            {!isPending && <Proof label="VC Hash" value={result.vc_hash} />}
            {!isPending && <Proof label="Chain Transaction" value={result.chain_tx} />}
          </section>

          {!isPending && <aside style={panel}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <ShieldCheck color="#0EA5E9" size={18} />
              <div style={sectionTitle}>VERIFY QR</div>
            </div>
            <div style={{ background: "#fff", borderRadius: 8, padding: 14, display: "flex", justifyContent: "center", marginBottom: 14 }}>
              <QRCodeSVG value={result.qr_data || verifyUrl} size={190} />
            </div>
            <div style={{ color: "#64748B", fontSize: 12, lineHeight: 1.6 }}>
              Scan or open the public verifier to prove the credential hash and candidate DID match the certified result.
            </div>
          </aside>}
        </div>

        {history.length > 1 && (
          <section style={{ ...panel, marginTop: 18 }}>
            <div style={sectionTitle}>RESULT HISTORY</div>
            <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
              {history.map((item) => (
                <button key={`${item.exam_id}-${item.vc_hash || item.status}`} onClick={() => { setSelectedResult(item); setResult(item); }} style={{ textAlign: "left", background: "#0A0F1E", border: "1px solid #1E293B", borderRadius: 8, padding: "12px 14px", cursor: "pointer" }}>
                  <div style={{ color: "#F1F5F9", fontWeight: 800 }}>{item.exam_title}</div>
                  <div style={{ color: "#64748B", fontSize: 12, marginTop: 4 }}>{item.status} / {item.percentage ?? "Pending"}%</div>
                </button>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function Metric({ label, value, color = "#F1F5F9" }) {
  return (
    <div style={{ background: "#0A0F1E", border: "1px solid #1E293B", borderRadius: 8, padding: "1rem" }}>
      <div style={metricLabel}>{label}</div>
      <div style={{ color, fontWeight: 850, marginTop: 5, wordBreak: "break-word" }}>{value}</div>
    </div>
  );
}

function Proof({ label, value }) {
  return (
    <div style={{ padding: "12px 0", borderTop: "1px solid #1E293B" }}>
      <div style={metricLabel}>{label}</div>
      <div style={{ color: "#0EA5E9", fontFamily: "monospace", fontSize: 12, wordBreak: "break-all", marginTop: 5 }}>{value}</div>
    </div>
  );
}

const panel = { background: "#0D1117", border: "1px solid #1E293B", borderRadius: 8, padding: "1.35rem" };
const eyebrow = { color: "#10B981", fontFamily: "monospace", fontSize: 10, letterSpacing: 2, marginBottom: 10 };
const title = { color: "#F1F5F9", margin: 0, fontSize: "2rem", lineHeight: 1.1 };
const muted = { color: "#64748B", maxWidth: 620, lineHeight: 1.7, marginTop: 10, fontSize: 14 };
const sectionTitle = { color: "#334155", fontFamily: "monospace", fontSize: 10, letterSpacing: 2 };
const metricLabel = { color: "#475569", fontFamily: "monospace", fontSize: 10, letterSpacing: 1 };
const primaryBtn = { display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 16px", borderRadius: 7, background: "#10B981", color: "#fff", textDecoration: "none", fontWeight: 800 };
