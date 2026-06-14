import { LockKeyhole, RadioTower, Shield } from "lucide-react";

export default function BehaviorTracker({ risk = 0, locked = true, onLockedChange }) {
  const status = risk >= 70 ? "HIGH RISK" : risk >= 40 ? "REVIEW" : "CLEAN";
  const statusColor = risk >= 70 ? "#EF4444" : risk >= 40 ? "#F59E0B" : "#10B981";

  return (
    <section style={panel}>
      <div style={sectionTitle}>TRUST LAYER</div>
      <div style={riskBox}>
        <div>
          <div style={riskLabel}>Session Risk</div>
          <div style={{ ...riskValue, color: statusColor }}>{risk}%</div>
        </div>
        <span style={{ ...statusPill, color: statusColor, background: `${statusColor}20` }}>{status}</span>
      </div>

      {[
        ["Question decrypted only after timed release", LockKeyhole, "#10B981"],
        ["Behavior and environment stream active", RadioTower, "#0EA5E9"],
        ["Credential certifier waiting for clearance", Shield, "#F59E0B"],
      ].map(([text, Icon, color]) => (
        <div key={text} style={trustRow}>
          <Icon size={17} color={color} />
          <span style={trustText}>{text}</span>
        </div>
      ))}

      <label style={lockToggle}>
        <input type="checkbox" checked={locked} onChange={(e) => onLockedChange?.(e.target.checked)} />
        Browser lockdown simulated
      </label>
    </section>
  );
}

const panel = { background: "#0D1117", border: "1px solid #1E293B", borderRadius: 8, padding: "1.25rem" };
const sectionTitle = { color: "#334155", fontSize: 10, fontFamily: "monospace", letterSpacing: 2, marginBottom: 12 };
const riskBox = { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px", background: "#0A0F1E", border: "1px solid #1E293B", borderRadius: 8, marginBottom: 10 };
const riskLabel = { color: "#475569", fontSize: 10, fontFamily: "monospace", letterSpacing: 1 };
const riskValue = { fontSize: 24, fontWeight: 850, marginTop: 2 };
const statusPill = { padding: "4px 8px", borderRadius: 999, fontSize: 10, fontFamily: "monospace", fontWeight: 800 };
const trustRow = { display: "flex", gap: 10, alignItems: "center", padding: "10px 0", borderBottom: "1px solid #101827" };
const trustText = { color: "#94A3B8", fontSize: 13, lineHeight: 1.45 };
const lockToggle = { display: "flex", gap: 9, alignItems: "center", color: "#64748B", fontSize: 12, marginTop: 12 };
