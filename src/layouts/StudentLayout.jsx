import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { auth } from "../config/firebase";

function StudentLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const logout = async () => {
    await auth.signOut();
    navigate("/login");
  };

  const btnStyle = (active) => ({
    ...styles.btn,
    background: active
      ? "linear-gradient(135deg,#38BDF8,#0EA5E9)"
      : "transparent",
    color: active ? "#0F172A" : "#E2E8F0",
    boxShadow: active ? "0 8px 18px rgba(56,189,248,0.25)" : "none",
    transform: active ? "scale(1.02)" : "scale(1)",
  });

  return (
    <div style={styles.container}>
      {/* SIDEBAR */}
      <aside style={styles.sidebar}>
        {/* BRAND */}
        <div>
          <h1 style={styles.logo}>SHAMMS</h1>
          <p style={styles.subtitle}>
            Student Portal
          </p>
        </div>

        {/* NAVIGATION */}
        <button
          onClick={() => navigate("/student/dashboard")}
          style={btnStyle(isActive("/student/dashboard"))}
        >
          📊 Dashboard
        </button>

        <button
          onClick={() => navigate("/student/my-room")}
          style={btnStyle(isActive("/student/my-room"))}
        >
          🏠 My Room
        </button>

        <button
          onClick={() => navigate("/student/payment-verification")}
          style={btnStyle(isActive("/student/payment-verification"))}
        >
          💳 Payments
        </button>

        <button
          onClick={() => navigate("/student/maintenance")}
          style={btnStyle(isActive("/student/maintenance"))}
        >
          🔧 Maintenance
        </button>

        {/* USER CARD */}
        <div style={styles.userCard}>
          <div style={styles.avatar}>S</div>
          <div>
            <p style={styles.name}>Student Portal</p>
            <p style={styles.meta}>SHAMMS System</p>
          </div>
        </div>

        {/* LOGOUT */}
        <button onClick={logout} style={styles.logout}>
          Logout
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <main style={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}

export default StudentLayout;
const styles = {
  container: {
    display: "flex",
    height: "100vh",
    background:
      "radial-gradient(circle at top, #0F172A, #020617)",
    color: "#E2E8F0",
    fontFamily: "Inter, sans-serif",
  },

  sidebar: {
    width: "260px",
    padding: "22px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",

    background: "rgba(17,24,39,0.75)",
    backdropFilter: "blur(16px)",
    borderRight: "1px solid rgba(255,255,255,0.06)",
  },

  logo: {
    fontSize: "26px",
    fontWeight: "bold",
    color: "#38BDF8",
    marginBottom: "2px",
  },

  subtitle: {
    fontSize: "12px",
    color: "#94A3B8",
    marginBottom: "18px",
  },

  btn: {
    padding: "12px 14px",
    borderRadius: "12px",
    border: "none",
    textAlign: "left",
    cursor: "pointer",
    fontSize: "14px",
    transition: "0.2s",
  },

  userCard: {
    marginTop: "auto",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "#1E293B",
    padding: "12px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.05)",
  },

  avatar: {
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    background: "linear-gradient(135deg,#38BDF8,#0EA5E9)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    color: "#0F172A",
  },

  name: {
    margin: 0,
    fontSize: "13px",
    fontWeight: "600",
  },

  meta: {
    margin: 0,
    fontSize: "11px",
    color: "#94A3B8",
  },

  logout: {
    marginTop: "12px",
    padding: "12px",
    borderRadius: "12px",
    border: "none",
    cursor: "pointer",
    background: "linear-gradient(135deg,#F4B400,#F59E0B)",
    fontWeight: "bold",
    color: "#0F172A",
  },

  main: {
    flex: 1,
    padding: "30px",
    overflowY: "auto",
  },
};