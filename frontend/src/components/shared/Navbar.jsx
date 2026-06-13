import { Link, useNavigate } from "react-router-dom";
import useStore from "../../store/useStore";

export default function Navbar() {
  const { role, logout } = useStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav style={{
      background: "#0A0F1E",
      borderBottom: "1px solid #1E293B",
      padding: "0 2rem",
      height: "56px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      position: "sticky",
      top: 0,
      zIndex: 100,
    }}>
      <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{
          width: 28, height: 28,
          background: "linear-gradient(135deg, #0EA5E9, #10B981)",
          borderRadius: 6,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14, fontWeight: 800, color: "#fff"
        }}>E</div>
        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16, color: "#F1F5F9", letterSpacing: "-0.3px" }}>
          ExamChain
        </span>
        <span style={{ fontFamily: "monospace", fontSize: 10, color: "#0EA5E9", background: "#0EA5E920", padding: "2px 6px", borderRadius: 4 }}>
          ZERO-TRUST
        </span>
      </Link>

      <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
        {!role && <>
          <Link to="/student"  style={linkStyle}>Student</Link>
          <Link to="/examiner" style={linkStyle}>Examiner</Link>
          <Link to="/admin"    style={linkStyle}>Admin</Link>
          <Link to="/verify"   style={{ ...linkStyle, color: "#10B981" }}>Verify ↗</Link>
        </>}
        {role === "student" && <>
          <Link to="/student" style={linkStyle}>My Exams</Link>
          <Link to="/results" style={linkStyle}>Results</Link>
        </>}
        {role === "examiner" && <>
          <Link to="/examiner" style={linkStyle}>Dashboard</Link>
        </>}
        {role && (
          <button onClick={handleLogout} style={{
            background: "transparent",
            border: "1px solid #1E293B",
            color: "#94A3B8",
            padding: "6px 14px",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 13,
            fontFamily: "Inter, sans-serif",
          }}>
            Sign out
          </button>
        )}
      </div>
    </nav>
  );
}

const linkStyle = {
  color: "#94A3B8",
  textDecoration: "none",
  fontSize: 13,
  fontWeight: 500,
  transition: "color 0.2s",
};