export default function QuestionUploader({
  questions,
  onQuestionChange,
  onAddQuestion,
  onUpload,
  loading,
}) {
  return (
    <div>
      {questions.map((q, i) => (
        <div key={i} style={questionBox}>
          <div style={questionNumber}>Q{i + 1}</div>
          <input placeholder="Question text" value={q.text} onChange={(e) => onQuestionChange(i, "text", e.target.value)} style={input} />
          <div style={optionGrid}>
            {["a", "b", "c", "d"].map((opt) => (
              <input
                key={opt}
                placeholder={`Option ${opt.toUpperCase()}`}
                value={q[`option_${opt}`]}
                onChange={(e) => onQuestionChange(i, `option_${opt}`, e.target.value)}
                style={{ ...input, marginBottom: 8 }}
              />
            ))}
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div>
              <label style={label}>Correct Answer</label>
              <select value={q.correct} onChange={(e) => onQuestionChange(i, "correct", e.target.value)} style={{ ...input, width: "auto", marginBottom: 0 }}>
                {["A", "B", "C", "D"].map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label style={label}>Difficulty (0-1)</label>
              <input type="number" step="0.1" min="0" max="1" value={q.difficulty} onChange={(e) => onQuestionChange(i, "difficulty", parseFloat(e.target.value))} style={{ ...input, width: 86, marginBottom: 0 }} />
            </div>
          </div>
        </div>
      ))}
      <div style={{ display: "flex", gap: 10 }}>
        <button type="button" onClick={onAddQuestion} style={ghostButton}>+ Add Question</button>
        <button type="button" onClick={onUpload} disabled={loading} style={primaryButton}>
          {loading ? "Encrypting..." : "Encrypt & Upload ->"}
        </button>
      </div>
    </div>
  );
}

const questionBox = { background: "#0D1117", border: "1px solid #1E293B", borderRadius: 10, padding: "1.25rem", marginBottom: 12 };
const questionNumber = { fontFamily: "monospace", fontSize: 10, color: "#F59E0B", marginBottom: 10 };
const optionGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8 };
const input = { width: "100%", padding: "10px 14px", borderRadius: 8, background: "#0A0F1E", border: "1px solid #1E293B", color: "#F1F5F9", fontSize: 13, fontFamily: "Inter, sans-serif", marginBottom: "0.75rem", outline: "none", boxSizing: "border-box" };
const label = { color: "#475569", fontSize: 11, display: "block", marginBottom: 5, fontFamily: "monospace" };
const ghostButton = { padding: "10px 18px", borderRadius: 7, background: "transparent", border: "1px solid #1E293B", color: "#94A3B8", fontSize: 13, cursor: "pointer", fontFamily: "Inter, sans-serif" };
const primaryButton = { padding: "10px 18px", borderRadius: 7, background: "#F59E0B", border: "none", color: "#0A0F1E", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "Inter, sans-serif" };
