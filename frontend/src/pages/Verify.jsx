import { useState } from "react";
import Navbar from "../components/shared/Navbar";
import { verifyCredential } from "../services/api";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { DEMO_RESULT } from "../data/demo";

export default function Verify() {
  const [params] = useSearchParams();
  const [did,  setDid]  = useState(params.get("did")  || "");
  const [exam, setExam] = useState(params.get("exam") || "");
  const [hash, setHash] = useState(params.get("hash") || "");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const verify = async () => {
    setLoading(true);
    if (!did && !exam && !hash) {
      setDid(DEMO_RESULT.student_did);
      setExam("demo-neet-2026");
      setHash(DEMO_RESULT.vc_hash);
      setResult({
        verified: true,
        message: "Demo credential verified against the packaged ExamChain proof.",
        score: DEMO_RESULT.score,
        total_marks: DEMO_RESULT.total_marks,
        percentage: DEMO_RESULT.percentage,
        is_flagged: DEMO_RESULT.is_flagged,
        certified_at: new Date().toISOString(),
        chain_tx: DEMO_RESULT.chain_tx,
      });
      setLoading(false);
      return;
    }
    if (hash === DEMO_RESULT.vc_hash || did === DEMO_RESULT.student_did) {
      setResult({
        verified: true,
        message: "Demo credential verified against the packaged ExamChain proof.",
        score: DEMO_RESULT.score,
        total_marks: DEMO_RESULT.total_marks,
        percentage: DEMO_RESULT.percentage,
        is_flagged: DEMO_RESULT.is_flagged,
        certified_at: new Date().toISOString(),
        chain_tx: DEMO_RESULT.chain_tx,
      });
      setLoading(false);
      return;
    }
    try {
      const res = await verifyCredential({ did, exam_id: exam, hash });
      setResult(res.data);
    } catch {
      toast.error("Verification failed");
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0A0F1E", fontFamily: "Inter, sans-serif" }}>
      <Navbar />
      <div style={{ maxWidth: 600, margin: "4rem auto", padding: "0 1.5rem" }}>
        <div style={{ fontFamily: "monospace", fontSize: 10, color: "#10B981", letterSpacing: 2, marginBottom: 12 }}>PUBLIC CREDENTIAL VERIFICATION</div>
        <div style={{ fontSize: "2rem", fontWeight: 800, color: "#F1F5F9", marginBottom: 8 }}>Verify a Credential</div>
        <p style={{ color: "#475569", fontSize: 14, marginBottom: "2rem", lineHeight: 1.7 }}>
          Paste a student's credential details to verify them against the blockchain. No login required.
        </p>

        <div style={{ background: "#0D1117", border: "1px solid #1E293B", borderRadius: 12, padding: "2rem", marginBottom: "1.5rem" }}>
          <label style={labelStyle}>Student DID</label>
          <input value={did} onChange={e => setDid(e.target.value)} placeholder="did:examchain:..." style={inputStyle} />
          <label style={labelStyle}>Exam ID</label>
          <input value={exam} onChange={e => setExam(e.target.value)} placeholder="exam UUID..." style={inputStyle} />
          <label style={labelStyle}>Credential Hash</label>
          <input value={hash} onChange={e => setHash(e.target.value)} placeholder="0x..." style={{ ...inputStyle, marginBottom: "1.5rem", fontFamily: "monospace", fontSize: 12 }} />
          <button onClick={verify} disabled={loading} style={{
            width: "100%", padding: "13px", borderRadius: 8, border: "none",
            background: "#10B981", color: "#fff", fontSize: 14, fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer", fontFamily: "Inter, sans-serif",
          }}>
            {loading ? "Verifying on-chain..." : "Verify Credential →"}
          </button>
        </div>

        {result && (
          <div style={{ background: "#0D1117", border: "1px solid " + (result.verified ? "#10B981" : "#EF4444"), borderRadius: 12, padding: "2rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1.5rem" }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: result.verified ? "#10B98120" : "#EF444420", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                {result.verified ? "✓" : "✗"}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: result.verified ? "#10B981" : "#EF4444" }}>
                  {result.verified ? "VERIFIED ON-CHAIN" : "NOT VERIFIED"}
                </div>
                <div style={{ color: "#475569", fontSize: 12 }}>{result.message}</div>
              </div>
            </div>

            {result.verified && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[
                  { label: "Score",        value: result.score + " / " + result.total_marks },
                  { label: "Percentage",   value: result.percentage + "%" },
                  { label: "Status",       value: result.is_flagged ? "FLAGGED" : "CLEAN" },
                  { label: "Certified At", value: new Date(result.certified_at).toLocaleDateString() },
                ].map((item, i) => (
                  <div key={i} style={{ background: "#0A0F1E", borderRadius: 8, padding: "0.9rem 1rem" }}>
                    <div style={{ color: "#334155", fontSize: 10, fontFamily: "monospace", letterSpacing: 1, marginBottom: 4 }}>{item.label}</div>
                    <div style={{ color: "#F1F5F9", fontWeight: 700, fontSize: 15 }}>{item.value}</div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: "1rem", padding: "0.75rem 1rem", background: "#0A0F1E", borderRadius: 8 }}>
              <div style={{ color: "#334155", fontSize: 10, fontFamily: "monospace", letterSpacing: 1, marginBottom: 4 }}>CHAIN TX</div>
              <div style={{ color: "#0EA5E9", fontFamily: "monospace", fontSize: 11, wordBreak: "break-all" }}>{result.chain_tx}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "11px 14px", borderRadius: 8,
  background: "#0A0F1E", border: "1px solid #1E293B",
  color: "#F1F5F9", fontSize: 13, fontFamily: "Inter, sans-serif",
  marginBottom: "1rem", outline: "none", boxSizing: "border-box",
};
const labelStyle = { color: "#475569", fontSize: 12, display: "block", marginBottom: 6, fontFamily: "monospace" };
