import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Play, FileCheck2, RadioTower } from "lucide-react";
import Navbar from "../components/shared/Navbar";
import useStore from "../store/useStore";
import { registerStudent, loginStudent, listExams } from "../services/api";
import { DEMO_EXAM } from "../data/demo";
import toast from "react-hot-toast";

export default function StudentLogin() {
  const navigate = useNavigate();
  const { token, role, setAuth } = useStore();
  const [mode, setMode] = useState("login");
  const [loading, setLoading] = useState(false);
  const [exams, setExams] = useState([DEMO_EXAM]);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const isStudent = token && role === "student";

  useEffect(() => {
    if (!isStudent) return;
    listExams()
      .then((res) => setExams(res.data?.length ? res.data : [DEMO_EXAM]))
      .catch(() => setExams([DEMO_EXAM]));
  }, [isStudent]);

  const handle = async () => {
    setLoading(true);
    try {
      const fn = mode === "login" ? loginStudent : registerStudent;
      const res = await fn(form);
      setAuth({
        name: form.name || res.data.name || "Student",
        email: form.email,
        did: res.data.did,
        student_id: res.data.student_id,
        tenant_id: res.data.tenant_id,
      }, res.data.access_token, "student");
      toast.success(mode === "login" ? "Welcome back!" : "Account created");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Backend unavailable. Opening demo student mode.");
      setAuth({ name: form.name || "Demo Candidate", email: form.email || "demo@examchain.local", did: "did:examchain:demo", student_id: "demo-student" }, "demo-token", "student");
    }
    setLoading(false);
  };

  if (isStudent) {
    return (
      <div style={page}>
        <Navbar />
        <main style={shell}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 20, alignItems: "flex-end", marginBottom: 28, flexWrap: "wrap" }}>
            <div>
              <div style={eyebrow}>STUDENT CONSOLE</div>
              <h1 style={h1}>My secure exam sessions</h1>
              <p style={muted}>Launch an available exam, track trust signals, and receive a verifiable credential after certification.</p>
            </div>
            <button style={primaryBtn} onClick={() => navigate(`/exam/${DEMO_EXAM.exam_id}`)}>
              <Play size={16} /> Start demo exam
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12, marginBottom: 26 }}>
            {[
              ["Identity", "DID bound", ShieldCheck, "#10B981"],
              ["Environment", "Auditor active", RadioTower, "#0EA5E9"],
              ["Credential", "VC ready", FileCheck2, "#F59E0B"],
            ].map(([label, value, Icon, color]) => (
              <div key={label} style={statCard}>
                <Icon size={18} color={color} />
                <div>
                  <div style={statLabel}>{label}</div>
                  <div style={{ color: "#F1F5F9", fontWeight: 700 }}>{value}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={sectionTitle}>AVAILABLE EXAMS</div>
          <div style={{ display: "grid", gap: 12 }}>
            {exams.map((exam) => (
              <div key={exam.exam_id} style={examCard}>
                <div>
                  <div style={{ color: "#F1F5F9", fontWeight: 800, fontSize: 18, marginBottom: 6 }}>{exam.title}</div>
                  <div style={{ color: "#64748B", fontSize: 13 }}>
                    {exam.subject || "General"} / {exam.duration_mins || 12} min / {exam.total_marks || 100} marks
                  </div>
                  <div style={{ color: "#334155", fontFamily: "monospace", fontSize: 11, marginTop: 10 }}>
                    {exam.merkle_root ? `MERKLE ${exam.merkle_root.slice(0, 24)}...` : "Demo Merkle proof available"}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={pill(exam.status === "ACTIVE" ? "#10B981" : "#F59E0B")}>{exam.status || "ACTIVE"}</span>
                  <button style={secondaryBtn} onClick={() => navigate(`/exam/${exam.exam_id || DEMO_EXAM.exam_id}`)}>
                    <Play size={15} /> Enter
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div style={page}>
      <Navbar />
      <main style={{ maxWidth: 440, margin: "6rem auto", padding: "0 1.5rem" }}>
        <div style={panel}>
          <div style={{ ...eyebrow, color: "#0EA5E9" }}>STUDENT ACCESS</div>
          <h1 style={{ ...h1, fontSize: "1.7rem", marginBottom: 8 }}>{mode === "login" ? "Sign in" : "Create account"}</h1>
          <p style={{ color: "#64748B", fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
            Access zero-trust exams with behavioral monitoring and portable result credentials.
          </p>

          <div style={segmented}>
            {["login", "register"].map((m) => (
              <button key={m} onClick={() => setMode(m)} style={segButton(mode === m)}>{m}</button>
            ))}
          </div>

          {mode === "register" && (
            <input placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} />
          )}
          <input placeholder="Email address" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={inputStyle} />
          <input
            placeholder="Password"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            style={{ ...inputStyle, marginBottom: "1.5rem" }}
            onKeyDown={(e) => e.key === "Enter" && handle()}
          />

          <button onClick={handle} disabled={loading} style={{ ...primaryBtn, width: "100%", justifyContent: "center" }}>
            {loading ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}
          </button>

          <button onClick={() => setAuth({ name: "Demo Candidate", did: "did:examchain:demo", student_id: "demo-student" }, "demo-token", "student")} style={{ ...ghostBtn, width: "100%", justifyContent: "center", marginTop: 10 }}>
            Open demo mode
          </button>
        </div>
      </main>
    </div>
  );
}

const page = { minHeight: "100vh", background: "#0A0F1E", fontFamily: "Inter, sans-serif" };
const shell = { maxWidth: 1080, margin: "0 auto", padding: "2.75rem 2rem" };
const panel = { background: "#0D1117", border: "1px solid #1E293B", borderRadius: 10, padding: "2.2rem" };
const eyebrow = { fontFamily: "monospace", fontSize: 10, color: "#10B981", letterSpacing: 2, marginBottom: 12 };
const h1 = { color: "#F1F5F9", fontSize: "2rem", lineHeight: 1.1, margin: 0, fontWeight: 850 };
const muted = { color: "#64748B", maxWidth: 620, lineHeight: 1.7, marginTop: 10, fontSize: 14 };
const sectionTitle = { fontFamily: "monospace", fontSize: 10, color: "#334155", letterSpacing: 2, marginBottom: 12 };
const statCard = { background: "#0D1117", border: "1px solid #1E293B", borderRadius: 8, padding: "1rem", display: "flex", alignItems: "center", gap: 12 };
const statLabel = { color: "#475569", fontSize: 11, fontFamily: "monospace", letterSpacing: 1, marginBottom: 4 };
const examCard = { background: "#0D1117", border: "1px solid #1E293B", borderRadius: 8, padding: "1.2rem", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" };
const primaryBtn = { display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 18px", borderRadius: 7, border: "none", background: "#0EA5E9", color: "#fff", fontWeight: 700, cursor: "pointer" };
const secondaryBtn = { display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 14px", borderRadius: 7, border: "1px solid #1E293B", background: "#101827", color: "#F1F5F9", fontWeight: 650, cursor: "pointer" };
const ghostBtn = { display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 16px", borderRadius: 7, border: "1px solid #1E293B", background: "transparent", color: "#94A3B8", cursor: "pointer" };
const pill = (color) => ({ padding: "5px 9px", borderRadius: 999, background: `${color}20`, color, fontSize: 10, fontFamily: "monospace", fontWeight: 800 });
const inputStyle = { width: "100%", padding: "11px 14px", borderRadius: 8, background: "#0A0F1E", border: "1px solid #1E293B", color: "#F1F5F9", fontSize: 14, marginBottom: "0.75rem", outline: "none", boxSizing: "border-box" };
const segmented = { display: "flex", gap: 0, marginBottom: "1.5rem", background: "#0A0F1E", borderRadius: 8, padding: 3 };
const segButton = (active) => ({ flex: 1, padding: "8px", borderRadius: 6, border: "none", cursor: "pointer", background: active ? "#1E293B" : "transparent", color: active ? "#F1F5F9" : "#64748B", fontSize: 13, fontWeight: active ? 700 : 500, textTransform: "capitalize" });
