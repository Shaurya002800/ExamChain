import { useState, useEffect } from "react";
import Navbar from "../components/shared/Navbar";
import IntegrityFeed from "../components/examiner/IntegrityFeed";
import QuestionUploader from "../components/examiner/QuestionUploader";
import useStore from "../store/useStore";
import { registerExaminer, loginExaminer, createExam, uploadQuestions, lockExam, listExams, getPendingResults, reviewResult } from "../services/api";
import toast from "react-hot-toast";

export default function ExaminerDashboard() {
  const { token, role, setAuth } = useStore();
  const [tab, setTab] = useState(() => (localStorage.getItem("role") === "examiner" ? "dashboard" : "login"));
  const [loading, setLoading] = useState(false);
  const [exams, setExams] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", password: "", institution: "" });
  const [examForm, setExamForm] = useState({
    title: "", subject: "", start_time: "", end_time: "", duration_mins: 180, total_marks: 100
  });
  const [questions, setQuestions] = useState([
    { text: "", option_a: "", option_b: "", option_c: "", option_d: "", correct: "A", difficulty: 0.5 }
  ]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [keyFingerprint, setKeyFingerprint] = useState("");
  const [reviewQueue, setReviewQueue] = useState([]);

  const isAuthed = token && role === "examiner";

  async function fetchExams() {
    try {
      const r = await listExams();
      setExams(r.data);
    } catch {
      setExams([]);
    }
  }

  useEffect(() => {
    if (!isAuthed) return;
    const timer = window.setTimeout(() => fetchExams(), 0);
    return () => window.clearTimeout(timer);
  }, [isAuthed]);

  const handleAuth = async () => {
    setLoading(true);
    try {
      const fn = tab === "login" ? loginExaminer : registerExaminer;
      const res = await fn(form);
      setAuth({ name: form.name }, res.data.access_token, "examiner");
      toast.success("Welcome!");
      setTab("dashboard");
    } catch (e) { toast.error(e.response?.data?.detail || "Auth failed"); }
    setLoading(false);
  };

  const handleCreateExam = async () => {
    setLoading(true);
    try {
      const res = await createExam(examForm);
      toast.success("Exam created!");
      setSelectedExam(res.data.exam_id);
      fetchExams();
      setTab("questions");
    } catch (e) { toast.error(e.response?.data?.detail || "Failed"); }
    setLoading(false);
  };

  const handleUploadQuestions = async () => {
    setLoading(true);
    try {
      const res = await uploadQuestions({ exam_id: selectedExam, questions });
      setKeyFingerprint(res.data.key_fingerprint);
      toast.success(`${res.data.uploaded} questions encrypted!`);
      setTab("lock");
    } catch (e) { toast.error(e.response?.data?.detail || "Failed"); }
    setLoading(false);
  };

  const openReview = async (examId) => {
    setSelectedExam(examId);
    setTab("review");
    setLoading(true);
    try {
      const res = await getPendingResults(examId);
      setReviewQueue(res.data);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Could not load review queue");
      setReviewQueue([]);
    }
    setLoading(false);
  };

  const handleReview = async (sessionId, decision) => {
    setLoading(true);
    try {
      await reviewResult(sessionId, {
        decision,
        note: decision === "CERTIFY" ? "Reviewed and released by examiner." : "Held for manual integrity investigation.",
      });
      toast.success(decision === "CERTIFY" ? "Result certified" : "Result held");
      await openReview(selectedExam);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Review failed");
    }
    setLoading(false);
  };

  const handleLock = async () => {
    setLoading(true);
    try {
      await lockExam(selectedExam);
      toast.success("Exam locked to blockchain!");
      setTab("dashboard");
      fetchExams();
    } catch (e) { toast.error(e.response?.data?.detail || "Lock failed"); }
    setLoading(false);
  };

  const addQuestion = () => setQuestions([...questions, { text: "", option_a: "", option_b: "", option_c: "", option_d: "", correct: "A", difficulty: 0.5 }]);
  const updateQ = (i, field, val) => { const q = [...questions]; q[i][field] = val; setQuestions(q); };

  // Auth screens
  if (!isAuthed) return (
    <div style={{ minHeight: "100vh", background: "#0A0F1E", fontFamily: "Inter, sans-serif" }}>
      <Navbar />
      <div style={{ maxWidth: 440, margin: "6rem auto", padding: "0 1.5rem" }}>
        <div style={{ background: "#0D1117", border: "1px solid #1E293B", borderRadius: 12, padding: "2.5rem" }}>
          <div style={{ fontFamily: "monospace", fontSize: 10, color: "#F59E0B", letterSpacing: 2, marginBottom: 16 }}>EXAMINER ACCESS</div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#F1F5F9", marginBottom: "1.5rem" }}>Examiner Portal</div>
          <div style={{ display: "flex", gap: 0, marginBottom: "1.5rem", background: "#0A0F1E", borderRadius: 8, padding: 3 }}>
            {["login","register"].map(m => (
              <button key={m} onClick={() => setTab(m)} style={{ flex: 1, padding: "8px", borderRadius: 6, border: "none", cursor: "pointer", background: tab === m ? "#1E293B" : "transparent", color: tab === m ? "#F1F5F9" : "#475569", fontSize: 13, fontWeight: tab === m ? 600 : 400, fontFamily: "Inter, sans-serif", textTransform: "capitalize" }}>{m}</button>
            ))}
          </div>
          {tab === "register" && <>
            <input placeholder="Full name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} style={inp} />
            <input placeholder="Institution" value={form.institution} onChange={e => setForm({...form, institution: e.target.value})} style={inp} />
          </>}
          <input placeholder="Email" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} style={inp} />
          <input placeholder="Password" type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} style={{...inp, marginBottom: "1.5rem"}} onKeyDown={e => e.key === "Enter" && handleAuth()} />
          <button onClick={handleAuth} disabled={loading} style={{ width: "100%", padding: "13px", borderRadius: 8, border: "none", background: "#F59E0B", color: "#0A0F1E", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
            {loading ? "Please wait..." : tab === "login" ? "Sign in →" : "Register →"}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#0A0F1E", fontFamily: "Inter, sans-serif" }}>
      <Navbar />
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "2.5rem 2rem" }}>

        {/* Tab nav */}
        <div style={{ display: "flex", gap: 8, marginBottom: "2rem" }}>
          {[["dashboard","My Exams"],["create","Create Exam"],["questions","Upload Questions"],["lock","Lock to Chain"],["review","Review Results"]].map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: "8px 16px", borderRadius: 7, cursor: "pointer",
              background: tab === t ? "#F59E0B" : "#0D1117",
              color: tab === t ? "#0A0F1E" : "#64748B",
              fontSize: 13, fontWeight: tab === t ? 700 : 400,
              fontFamily: "Inter, sans-serif",
              border: tab === t ? "none" : "1px solid #1E293B",
            }}>{label}</button>
          ))}
        </div>

        {/* Dashboard */}
        {tab === "dashboard" && (
          <div>
            <div style={{ fontFamily: "monospace", fontSize: 10, color: "#F59E0B", letterSpacing: 2, marginBottom: 20 }}>YOUR EXAMS</div>
            {exams.length === 0 ? (
              <div style={{ background: "#0D1117", border: "1px solid #1E293B", borderRadius: 10, padding: "3rem", textAlign: "center" }}>
                <div style={{ color: "#475569", marginBottom: 16 }}>No exams yet.</div>
                <button onClick={() => setTab("create")} style={{ padding: "10px 20px", borderRadius: 7, background: "#F59E0B", color: "#0A0F1E", border: "none", fontWeight: 700, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Create your first exam →</button>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {exams.map(exam => (
                  <div key={exam.exam_id} style={{ background: "#0D1117", border: "1px solid #1E293B", borderRadius: 10, padding: "1.25rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontWeight: 700, color: "#F1F5F9", fontSize: 15, marginBottom: 4 }}>{exam.title}</div>
                      <div style={{ color: "#475569", fontSize: 12, fontFamily: "monospace" }}>{exam.subject} · {exam.total_marks} marks · {new Date(exam.start_time).toLocaleDateString()}</div>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{
                        padding: "4px 10px", borderRadius: 20, fontSize: 10, fontFamily: "monospace", fontWeight: 700,
                        background: exam.status === "LOCKED" ? "#10B98120" : "#F59E0B20",
                        color: exam.status === "LOCKED" ? "#10B981" : "#F59E0B",
                      }}>{exam.status}</span>
                      {exam.merkle_root && (
                        <span style={{ fontFamily: "monospace", fontSize: 10, color: "#334155" }}>{exam.merkle_root.slice(0, 14)}...</span>
                      )}
                      <button
                        onClick={() => openReview(exam.exam_id)}
                        style={{ padding: "7px 10px", borderRadius: 7, border: "1px solid #1E293B", background: "#0A0F1E", color: "#94A3B8", cursor: "pointer", fontSize: 12, fontFamily: "Inter, sans-serif" }}
                      >
                        Review
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Create Exam */}
        {tab === "create" && (
          <div style={{ maxWidth: 540 }}>
            <div style={{ fontFamily: "monospace", fontSize: 10, color: "#F59E0B", letterSpacing: 2, marginBottom: 20 }}>CREATE NEW EXAM</div>
            {[["title","Exam Title"],["subject","Subject"]].map(([k,p]) => (
              <input key={k} placeholder={p} value={examForm[k]} onChange={e => setExamForm({...examForm, [k]: e.target.value})} style={inp} />
            ))}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={lbl}>Start Time</label>
                <input type="datetime-local" value={examForm.start_time} onChange={e => setExamForm({...examForm, start_time: e.target.value})} style={{...inp, colorScheme: "dark"}} />
              </div>
              <div>
                <label style={lbl}>End Time</label>
                <input type="datetime-local" value={examForm.end_time} onChange={e => setExamForm({...examForm, end_time: e.target.value})} style={{...inp, colorScheme: "dark"}} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: "1.5rem" }}>
              <div>
                <label style={lbl}>Duration (mins)</label>
                <input type="number" value={examForm.duration_mins} onChange={e => setExamForm({...examForm, duration_mins: parseInt(e.target.value)})} style={inp} />
              </div>
              <div>
                <label style={lbl}>Total Marks</label>
                <input type="number" value={examForm.total_marks} onChange={e => setExamForm({...examForm, total_marks: parseInt(e.target.value)})} style={inp} />
              </div>
            </div>
            <button onClick={handleCreateExam} disabled={loading} style={{ width: "100%", padding: "13px", borderRadius: 8, border: "none", background: "#F59E0B", color: "#0A0F1E", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
              {loading ? "Creating..." : "Create Exam →"}
            </button>
          </div>
        )}

        {/* Upload Questions */}
        {tab === "questions" && (
          <div>
            <div style={{ fontFamily: "monospace", fontSize: 10, color: "#F59E0B", letterSpacing: 2, marginBottom: 8 }}>UPLOAD QUESTIONS</div>
            {!selectedExam && (
              <div style={{ marginBottom: "1.5rem" }}>
                <label style={lbl}>Select Exam</label>
                <select value={selectedExam || ""} onChange={e => setSelectedExam(e.target.value)} style={{...inp, marginBottom: 0}}>
                  <option value="">-- select exam --</option>
                  {exams.map(e => <option key={e.exam_id} value={e.exam_id}>{e.title}</option>)}
                </select>
              </div>
            )}
            <QuestionUploader
              questions={questions}
              onQuestionChange={updateQ}
              onAddQuestion={addQuestion}
              onUpload={handleUploadQuestions}
              loading={loading}
            />
          </div>
        )}

        {/* Lock to Chain */}
        {tab === "lock" && (
          <div style={{ maxWidth: 540 }}>
            <div style={{ fontFamily: "monospace", fontSize: 10, color: "#10B981", letterSpacing: 2, marginBottom: 20 }}>LOCK TO BLOCKCHAIN</div>
            {keyFingerprint && (
              <div style={{ background: "#0D1117", border: "1px solid #F59E0B", borderRadius: 10, padding: "1.25rem", marginBottom: "1.5rem" }}>
                <div style={{ fontFamily: "monospace", fontSize: 10, color: "#F59E0B", marginBottom: 8, letterSpacing: 1 }}>SERVER KEY ESCROW FINGERPRINT</div>
                <div style={{ fontFamily: "monospace", fontSize: 11, color: "#10B981", wordBreak: "break-all", lineHeight: 1.7 }}>{keyFingerprint}</div>
                <div style={{ color: "#475569", fontSize: 11, marginTop: 8 }}>The raw AES key stays encrypted on the backend. This fingerprint is your audit reference.</div>
              </div>
            )}
            <div style={{ background: "#0D1117", border: "1px solid #1E293B", borderRadius: 10, padding: "1.5rem", marginBottom: "1.5rem" }}>
              <div style={{ fontWeight: 700, color: "#F1F5F9", marginBottom: 8 }}>What happens when you lock:</div>
              {["Merkle tree built from all question hashes", "Question key remains in encrypted server escrow", "Paper becomes cryptographically locked before release", "Blockchain or local ledger transaction hash becomes immutable proof"].map((item, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                  <span style={{ color: "#10B981", fontFamily: "monospace", fontSize: 11 }}>✓</span>
                  <span style={{ color: "#64748B", fontSize: 13 }}>{item}</span>
                </div>
              ))}
            </div>
            <button onClick={handleLock} disabled={loading} style={{ width: "100%", padding: "13px", borderRadius: 8, border: "none", background: "#10B981", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
              {loading ? "Locking..." : "Lock Exam to Blockchain →"}
            </button>
          </div>
        )}

        {tab === "review" && (
          <div>
            <div style={{ fontFamily: "monospace", fontSize: 10, color: "#F59E0B", letterSpacing: 2, marginBottom: 8 }}>EXAMINER CERTIFICATION QUEUE</div>
            {!selectedExam && (
              <div style={{ marginBottom: "1.5rem" }}>
                <label style={lbl}>Select Exam</label>
                <select value="" onChange={e => e.target.value && openReview(e.target.value)} style={{...inp, marginBottom: 0}}>
                  <option value="">-- select exam --</option>
                  {exams.map(e => <option key={e.exam_id} value={e.exam_id}>{e.title}</option>)}
                </select>
              </div>
            )}
            {loading ? (
              <div style={{ color: "#64748B" }}>Loading review queue...</div>
            ) : reviewQueue.length === 0 ? (
              <div style={{ background: "#0D1117", border: "1px solid #1E293B", borderRadius: 10, padding: "2rem", color: "#64748B" }}>
                No completed sessions are waiting for review yet.
              </div>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {reviewQueue.map(item => (
                  <div key={item.session_id} style={{ background: "#0D1117", border: "1px solid #1E293B", borderRadius: 10, padding: "1.25rem", display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
                    <div>
                      <div style={{ color: "#F1F5F9", fontWeight: 800, marginBottom: 5 }}>{item.student_name}</div>
                      <div style={{ color: "#475569", fontSize: 12, fontFamily: "monospace" }}>
                        {item.answers_count} answers · integrity {Math.round((item.integrity_score || 0) * 100)}% · {item.status}
                      </div>
                      {item.vc_hash && <div style={{ color: "#334155", fontSize: 11, fontFamily: "monospace", marginTop: 5 }}>{item.vc_hash.slice(0, 24)}...</div>}
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button disabled={loading || item.status === "CERTIFIED"} onClick={() => handleReview(item.session_id, "CERTIFY")} style={{ padding: "9px 13px", borderRadius: 7, border: "none", background: item.status === "CERTIFIED" ? "#1E293B" : "#10B981", color: "#fff", fontWeight: 800, cursor: "pointer" }}>
                        Certify
                      </button>
                      <button disabled={loading || item.status === "HELD"} onClick={() => handleReview(item.session_id, "HOLD")} style={{ padding: "9px 13px", borderRadius: 7, border: "1px solid #7F1D1D", background: "#450A0A", color: "#FCA5A5", fontWeight: 800, cursor: "pointer" }}>
                        Hold
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "dashboard" && exams.length > 0 && (
          <div style={{ marginTop: "2rem" }}>
            <IntegrityFeed />
          </div>
        )}
      </div>
    </div>
  );
}

const inp = {
  width: "100%", padding: "10px 14px", borderRadius: 8,
  background: "#0A0F1E", border: "1px solid #1E293B",
  color: "#F1F5F9", fontSize: 13, fontFamily: "Inter, sans-serif",
  marginBottom: "0.75rem", outline: "none", boxSizing: "border-box",
};
const lbl = { color: "#475569", fontSize: 11, display: "block", marginBottom: 5, fontFamily: "monospace" };
