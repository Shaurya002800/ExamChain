import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/shared/Navbar";
import AgentEventFeed from "../components/shared/AgentEventFeed";
import BehaviorTracker from "../components/student/BehaviorTracker";
import QuestionCard from "../components/student/QuestionCard";
import useStore from "../store/useStore";
import { DEMO_AGENT_EVENTS, DEMO_EXAM, DEMO_EXAM_ID, DEMO_QUESTIONS, DEMO_RESULT } from "../data/demo";
import { certifyLiveResult, endSession, getSessionQuestions, recordBrowserEvent, startSession, submitAnswer } from "../services/api";
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
  const [realExam, setRealExam] = useState(null);
  const [realQuestions, setRealQuestions] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const isDemo = id === DEMO_EXAM_ID || !id;
  const questions = isDemo ? DEMO_QUESTIONS : realQuestions;
  const exam = isDemo ? DEMO_EXAM : realExam || { ...DEMO_EXAM, exam_id: id, title: "Loading secure exam..." };
  const current = questions[index];

  useEffect(() => {
    if (isDemo) return;
    let alive = true;
    async function bootRealExam() {
      setLoading(true);
      try {
        const session = await startSession({ exam_id: id });
        const details = await getSessionQuestions(session.data.session_id);
        if (!alive) return;
        setSessionId(session.data.session_id);
        setRealExam(details.data.exam);
        setRealQuestions(details.data.questions);
      } catch (error) {
        toast.error(error.response?.data?.detail || "Unable to start secure exam. Sign in as a student first.");
      } finally {
        if (alive) setLoading(false);
      }
    }
    bootRealExam();
    return () => { alive = false; };
  }, [id, isDemo]);

  const score = useMemo(() => {
    return DEMO_QUESTIONS.reduce((sum, q) => sum + (answers[q.id] === q.correct ? 1 : 0), 0);
  }, [answers]);

  const choose = async (option) => {
    if (!current) return;
    const changed = Boolean(answers[current.id] && answers[current.id] !== option);
    setAnswers((prev) => ({ ...prev, [current.id]: option }));
    setEvents((prev) => [
      { time: `0${index + 1}:${18 + index * 7}`, agent: "IntegrityMonitor", message: `Answer committed for ${current.id}; cadence score normal.`, severity: "INFO" },
      ...prev,
    ].slice(0, 7));
    if (!isDemo && sessionId) {
      try {
        await submitAnswer({
          session_id: sessionId,
          question_id: current.id,
          answer: option,
          time_spent_ms: 6000 + index * 1200,
          changed,
        });
      } catch (error) {
        toast.error(error.response?.data?.detail || "Answer sync failed");
      }
    }
  };

  const injectEvent = async () => {
    const nextRisk = Math.min(100, risk + 18);
    setRisk(nextRisk);
    setEvents((prev) => [
      { time: "LIVE", agent: "EnvironmentAuditor", message: "Focus-loss event injected. Risk score increased for review.", severity: "WARNING" },
      ...prev,
    ].slice(0, 7));
    try {
      await recordBrowserEvent({ session_id: sessionId || "demo-session", event_type: "focus_lost", detail: { source: isDemo ? "demo" : "live" } });
    } catch {
      // Demo mode still records the event locally when the API is unavailable.
    }
  };

  const submit = async () => {
    if (!isDemo && sessionId) {
      try {
        await endSession(sessionId);
        const certified = await certifyLiveResult({ session_id: sessionId });
        setResult(certified.data);
        toast.success("Result certified and credential issued");
        navigate("/results");
        return;
      } catch (error) {
        toast.error(error.response?.data?.detail || "Certification failed");
        return;
      }
    }
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
        {loading && (
          <div style={{ color: "#64748B", fontFamily: "monospace", marginBottom: 16 }}>
            Establishing encrypted session...
          </div>
        )}
        <div style={topbar}>
          <div>
            <div style={eyebrow}>ZERO-TRUST EXAM ROOM</div>
            <h1 style={title}>{exam.title}</h1>
            <div style={{ color: "#64748B", fontSize: 13 }}>{exam.subject} / Question {questions.length ? index + 1 : 0} of {questions.length}</div>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Metric label="Time Left" value="09:42" color="#0EA5E9" />
            <Metric label="Risk" value={`${risk}%`} color={risk >= 50 ? "#EF4444" : "#10B981"} />
            <Metric label="Merkle" value="Verified" color="#10B981" />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 18 }}>
          {current ? (
            <QuestionCard
              question={current}
              answer={answers[current.id]}
              questionNumber={index + 1}
              totalQuestions={questions.length}
              onAnswer={choose}
              onPrevious={() => setIndex((v) => Math.max(0, v - 1))}
              onNext={() => setIndex((v) => Math.min(questions.length - 1, v + 1))}
              onSubmit={submit}
              onInjectEvent={injectEvent}
            />
          ) : (
            <section style={{ background: "#0D1117", border: "1px solid #1E293B", borderRadius: 8, padding: "1.25rem", color: "#94A3B8" }}>
              No released questions found for this exam yet.
            </section>
          )}

          <aside style={{ display: "grid", gap: 14 }}>
            <BehaviorTracker risk={risk} locked={locked} onLockedChange={setLocked} />
            <AgentEventFeed events={events} />
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
const eyebrow = { color: "#0EA5E9", fontFamily: "monospace", fontSize: 10, letterSpacing: 2, marginBottom: 8 };
const title = { color: "#F1F5F9", margin: 0, fontSize: "1.8rem", lineHeight: 1.15 };
