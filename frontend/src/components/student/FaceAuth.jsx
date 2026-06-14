import { Camera, CheckCircle2, ScanFace } from "lucide-react";

export default function FaceAuth({ status = "verified", confidence = 98, onRecheck }) {
  const ok = status === "verified";

  return (
    <section style={panel}>
      <div style={header}>
        <div style={iconWrap(ok)}>
          {ok ? <CheckCircle2 size={20} /> : <ScanFace size={20} />}
        </div>
        <div>
          <div style={sectionTitle}>FACE AUTH</div>
          <div style={{ color: ok ? "#10B981" : "#F59E0B", fontWeight: 800 }}>
            {ok ? "Identity verified" : "Recheck required"}
          </div>
        </div>
      </div>
      <div style={copy}>Candidate identity is bound to this session before credential issuance.</div>
      <div style={meter}>
        <div style={{ ...meterFill, width: `${Math.min(100, confidence)}%` }} />
      </div>
      <button type="button" onClick={onRecheck} style={button}>
        <Camera size={15} /> Recheck
      </button>
    </section>
  );
}

const panel = { background: "#0D1117", border: "1px solid #1E293B", borderRadius: 8, padding: "1.25rem" };
const header = { display: "flex", gap: 12, alignItems: "center", marginBottom: 12 };
const iconWrap = (ok) => ({ width: 40, height: 40, borderRadius: 8, display: "grid", placeItems: "center", color: ok ? "#10B981" : "#F59E0B", background: ok ? "#10B98120" : "#F59E0B20" });
const sectionTitle = { color: "#334155", fontSize: 10, fontFamily: "monospace", letterSpacing: 2, marginBottom: 4 };
const copy = { color: "#64748B", fontSize: 12, lineHeight: 1.5 };
const meter = { height: 5, background: "#101827", borderRadius: 999, overflow: "hidden", marginTop: 14 };
const meterFill = { height: "100%", background: "#10B981", borderRadius: 999 };
const button = { marginTop: 14, display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 11px", borderRadius: 7, border: "1px solid #1E293B", background: "transparent", color: "#94A3B8", cursor: "pointer" };
