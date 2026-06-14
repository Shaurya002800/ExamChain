import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, LockKeyhole, RadioTower, Send, Shield } from "lucide-react";
import Navbar from "../components/shared/Navbar";
import useStore from "../store/useStore";
import { DEMO_AGENT_EVENTS, DEMO_EXAM, DEMO_EXAM_ID, DEMO_QUESTIONS, DEMO_RESULT } from "../data/demo";
import { recordBrowserEvent } from "../services/api";
import toast from "react-hot-toast";

export default function ExamRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setResult } = useStore();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [risk, setRisk] = useState(8);
  const [events, setEvents] = useState(DEMO_AGENT_EVENTS);
  const [locked, setLocked] = useState(true);
  const exam = id === DEMO_EXAM_ID || !id ? DEMO_EXAM : { ...DEMO_EXAM, exam_id: id };
  const current = DEMO_QUESTIONS[index];

  const score = useMemo(() => {
    return DEMO_QUESTIONS.reduce((sum, q) => sum + (answers[q.id] === q.correct ? 1 : 0), 0);
  }, [answers]);

  const choose = (option) => {
    setAnswers((prev) => ({ ...prev, [current.id]: option }));
    setEvents((prev) => [
      { time: `0${index + 1}:${18 + index * 7}`, agent: "IntegrityMonitor", message: `Answer committed for ${current.id}; cadence score normal.`, severity: "INFO" },
      ...prev,
    ].slice(0, 7));
  };

  const injectEvent = async () => {
    const nextRisk = Math.min(100, risk + 18);
    setRisk(nextRisk);
    setEvents((prev) => [
      { time: "LIVE", agent: "EnvironmentAuditor", message: "Focus-loss event injected. Risk score increased for review.", severity: "WARNING" },
      ...prev,
    ].slice(0, 7));
    try {
      await recordBrowserEvent({ session_id: "demo-session", event_type: "focus_lost", detail: { source: "demo" } });
    } catch {
      // Demo mode still records the event locally when the API is unavailable.
    }
  };

  const submit = () => {
    const percentage = Math.round((score / DEMO_QUESTIONS.length) * 100);
    const result = {
      ...DEMO_RESULT,
      score: Math.round((percentage / 100) * DEMO_RESULT.total_marks),
      percentage,
      is_flagged: risk >= 50,
    };
    setResult(result);
    toast.success("Result certified and credential issued");
    navigate("/results");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0A0F1E", fontFamily: "Inter, sans-serif" }}>
      <Navbar />
      <main style={{ maxWidth: 1180, margin: "0 auto", padding: "1.6rem 1.5rem 2.5rem" }}>
        <div style={topbar}>
          <div>
            <div style={eyebrow}>ZERO-TRUST EXAM ROOM</div>
            <h1 style={title}>{exam.title}</h1>
            <div style={{ color: "#64748B", fontSize: 13 }}>{exam.subject} / Question {index + 1} of {DEMO_QUESTIONS.length}</div>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Metric label="Time Left" value="09:42" color="#0EA5E9" />
            <Metric label="Risk" value={`${risk}%`} color={risk >= 50 ? "#EF4444" : "#10B981"} />
            <Metric label="Merkle" value="Verified" color="#10B981" />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 18 }}>
          <section style={panel}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 18, alignItems: "center" }}>
              <span style={pill("#0EA5E9")}>{current.subject_area}</span>
              <span style={{ color: "#475569", fontFamily: "monospace", fontSize: 11 }}>HASH {current.hash.slice(0, 22)}...</span>
            </div>
            <h2 style={{ color: "#F1F5F9", fontSize: "1.45rem", lineHeight: 1.35, marginBottom: 22 }}>{current.text}</h2>

            <div style={{ display: "grid", gap: 10 }}>
              {Object.entries(current.options).map(([key, value]) => {
                const selected = answers[current.id] === key;
                return (
                  <button key={key} onClick={() => choose(key)} style={optionStyle(selected)}>
                    <span style={optionKey(selected)}>{key}</span>
                    <span>{value}</span>
                  </button>
                );
              })}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginTop: 26, flexWrap: "wrap" }}>
              <button style={ghostBtn} onClick={injectEvent}><AlertTriangle size={16} /> Inject attack event</button>
              <div style={{ display: "flex", gap: 10 }}>
                <button style={ghostBtn} disabled={index === 0} onClick={() => setIndex((v) => Math.max(0, v - 1))}>Previous</button>
                {index < DEMO_QUESTIONS.length - 1 ? (
                  <button style={primaryBtn} onClick={() => setIndex((v) => v + 1)}>Next question</button>
                ) : (
                  <button style={primaryBtn} onClick={submit}><Send size={16} /> Submit and certify</button>
                )}
              </div>
            </div>
          </section>

          <aside style={{ display: "grid", gap: 14 }}>
            <section style={panel}>
              <div style={sectionTitle}>TRUST LAYER</div>
              {[
                ["Question decrypted only after timed release", LockKeyhole, "#10B981"],
                ["Behavior and environment stream active", RadioTower, "#0EA5E9"],
                ["Credential certifier waiting for clearance", Shield, "#F59E0B"],
              ].map(([text, Icon, color]) => (
                <div key={text} style={{ display: "flex", gap: 10, alignItems: "center", padding: "10px 0", borderBottom: "1px solid #101827" }}>
                  <Icon size={17} color={color} />
                  <span style={{ color: "#94A3B8", fontSize: 13, lineHeight: 1.45 }}>{text}</span>
                </div>
              ))}
              <label style={{ display: "flex", gap: 9, alignItems: "center", color: "#64748B", fontSize: 12, marginTop: 12 }}>
                <input type="checkbox" checked={locked} onChange={(e) => setLocked(e.target.checked)} />
                Browser lockdown simulated
              </label>
            </section>

            <section style={panel}>
              <div style={sectionTitle}>LIVE AGENT FEED</div>
              <div style={{ display: "grid", gap: 9 }}>
                {events.map((event, i) => (
                  <div key={`${event.time}-${i}`} style={{ borderLeft: `3px solid ${event.severity === "WARNING" ? "#F59E0B" : "#10B981"}`, paddingLeft: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                      <span style={{ color: "#F1F5F9", fontFamily: "monospace", fontSize: 11 }}>{event.agent}</span>
                      <span style={{ color: "#334155", fontFamily: "monospace", fontSize: 10 }}>{event.time}</span>
                    </div>
                    <div style={{ color: "#64748B", fontSize: 12, lineHeight: 1.45, marginTop: 3 }}>{event.message}</div>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}

function Metric({ label, value, color }) {
  return (
    <div style={{ background: "#0D1117", border: "1px solid #1E293B", borderRadius: 8, padding: "9px 13px", minWidth: 104 }}>
      <div style={{ color: "#475569", fontSize: 10, fontFamily: "monospace", letterSpacing: 1 }}>{label}</div>
      <div style={{ color, fontWeight: 800, marginTop: 3 }}>{value}</div>
    </div>
  );
}

const topbar = { display: "flex", justifyContent: "space-between", gap: 18, alignItems: "flex-end", marginBottom: 18, flexWrap: "wrap" };
const panel = { background: "#0D1117", border: "1px solid #1E293B", borderRadius: 8, padding: "1.25rem" };
const eyebrow = { color: "#0EA5E9", fontFamily: "monospace", fontSize: 10, letterSpacing: 2, marginBottom: 8 };
const title = { color: "#F1F5F9", margin: 0, fontSize: "1.8rem", lineHeight: 1.15 };
const sectionTitle = { color: "#334155", fontSize: 10, fontFamily: "monospace", letterSpacing: 2, marginBottom: 12 };
const primaryBtn = { display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 16px", borderRadius: 7, border: "none", background: "#0EA5E9", color: "#fff", fontWeight: 750, cursor: "pointer" };
const ghostBtn = { display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 7, border: "1px solid #1E293B", background: "transparent", color: "#94A3B8", cursor: "pointer" };
const pill = (color) => ({ background: `${color}20`, color, borderRadius: 999, padding: "5px 9px", fontSize: 10, fontFamily: "monospace", fontWeight: 800 });
const optionStyle = (selected) => ({ display: "flex", gap: 12, alignItems: "center", textAlign: "left", width: "100%", padding: "14px", borderRadius: 8, border: selected ? "1px solid #0EA5E9" : "1px solid #1E293B", background: selected ? "#0EA5E914" : "#0A0F1E", color: selected ? "#F1F5F9" : "#94A3B8", cursor: "pointer", lineHeight: 1.45 });
const optionKey = (selected) => ({ width: 26, height: 26, borderRadius: 6, display: "inline-flex", alignItems: "center", justifyContent: "center", background: selected ? "#0EA5E9" : "#101827", color: selected ? "#fff" : "#64748B", fontWeight: 800, flex: "0 0 auto" });
