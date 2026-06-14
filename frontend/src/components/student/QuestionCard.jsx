import { AlertTriangle, Send } from "lucide-react";

export default function QuestionCard({
  question,
  answer,
  questionNumber,
  totalQuestions,
  onAnswer,
  onPrevious,
  onNext,
  onSubmit,
  onInjectEvent,
}) {
  const isLast = questionNumber === totalQuestions;

  return (
    <section style={panel}>
      <div style={cardHeader}>
        <span style={pill("#0EA5E9")}>{question.subject_area || "Question"}</span>
        <span style={hashText}>HASH {question.hash?.slice(0, 22)}...</span>
      </div>

      <div style={metaRow}>
        <span>Question {questionNumber} of {totalQuestions}</span>
        <span>Difficulty {Math.round((question.difficulty || 0) * 100)}%</span>
      </div>

      <h2 style={questionTitle}>{question.text}</h2>

      <div style={{ display: "grid", gap: 10 }}>
        {Object.entries(question.options || {}).map(([key, value]) => {
          const selected = answer === key;
          return (
            <button key={key} onClick={() => onAnswer(key)} style={optionStyle(selected)}>
              <span style={optionKey(selected)}>{key}</span>
              <span>{value}</span>
            </button>
          );
        })}
      </div>

      <div style={footer}>
        <button type="button" style={ghostBtn} onClick={onInjectEvent}>
          <AlertTriangle size={16} /> Inject attack event
        </button>
        <div style={{ display: "flex", gap: 10 }}>
          <button type="button" style={ghostBtn} disabled={questionNumber === 1} onClick={onPrevious}>
            Previous
          </button>
          {isLast ? (
            <button type="button" style={primaryBtn} onClick={onSubmit}>
              <Send size={16} /> Submit and certify
            </button>
          ) : (
            <button type="button" style={primaryBtn} onClick={onNext}>
              Next question
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

const panel = { background: "#0D1117", border: "1px solid #1E293B", borderRadius: 8, padding: "1.25rem" };
const cardHeader = { display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 14, alignItems: "center", flexWrap: "wrap" };
const metaRow = { display: "flex", justifyContent: "space-between", color: "#475569", fontSize: 11, fontFamily: "monospace", marginBottom: 14 };
const hashText = { color: "#475569", fontFamily: "monospace", fontSize: 11 };
const questionTitle = { color: "#F1F5F9", fontSize: "1.45rem", lineHeight: 1.35, marginBottom: 22 };
const footer = { display: "flex", justifyContent: "space-between", gap: 12, marginTop: 26, flexWrap: "wrap" };
const primaryBtn = { display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 16px", borderRadius: 7, border: "none", background: "#0EA5E9", color: "#fff", fontWeight: 750, cursor: "pointer" };
const ghostBtn = { display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 7, border: "1px solid #1E293B", background: "transparent", color: "#94A3B8", cursor: "pointer" };
const pill = (color) => ({ background: `${color}20`, color, borderRadius: 999, padding: "5px 9px", fontSize: 10, fontFamily: "monospace", fontWeight: 800 });
const optionStyle = (selected) => ({ display: "flex", gap: 12, alignItems: "center", textAlign: "left", width: "100%", padding: "14px", borderRadius: 8, border: selected ? "1px solid #0EA5E9" : "1px solid #1E293B", background: selected ? "#0EA5E914" : "#0A0F1E", color: selected ? "#F1F5F9" : "#94A3B8", cursor: "pointer", lineHeight: 1.45 });
const optionKey = (selected) => ({ width: 26, height: 26, borderRadius: 6, display: "inline-flex", alignItems: "center", justifyContent: "center", background: selected ? "#0EA5E9" : "#101827", color: selected ? "#fff" : "#64748B", fontWeight: 800, flex: "0 0 auto" });
