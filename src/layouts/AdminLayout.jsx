import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { auth, db } from "../config/firebase";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";

function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [adminName, setAdminName] = useState("Administrator");

  useEffect(() => {
    const fetchAdmin = async () => {
      try {
        const user = auth.currentUser;

        if (!user) return;

        const snap = await getDoc(
          doc(db, "users", user.uid)
        );

        if (snap.exists()) {
          setAdminName(
            snap.data().fullName || "Administrator"
          );
        }
      } catch (err) {
        console.log(err);
      }
    };

    fetchAdmin();
  }, []);

  const isActive = (path) =>
    location.pathname === path;

  const logout = async () => {
    await auth.signOut();
    navigate("/login");
  };

  const getBtnStyle = (active) => ({
    ...styles.btn,

    background: active
      ? "linear-gradient(135deg,#38BDF8,#0EA5E9)"
      : "transparent",

    color: active
      ? "#0F172A"
      : "#CBD5E1",

    fontWeight: active ? "600" : "400",

    boxShadow: active
      ? "0 10px 25px rgba(56,189,248,0.25)"
      : "none",
  });

  return (
    <div style={styles.container}>
      {/* SIDEBAR */}

      <aside style={styles.sidebar}>
        {/* LOGO */}

        <div>
          <h1 style={styles.logo}>
            SHAMMS
          </h1>

          <p style={styles.subtitle}>
            Smart Hostel Allocation &
            Maintenance System
          </p>

          <div style={styles.systemBadge}>
            ● System Online
          </div>
        </div>

        {/* NAVIGATION */}

        <button
          onClick={() =>
            navigate("/admin/dashboard")
          }
          style={getBtnStyle(
            isActive("/admin/dashboard")
          )}
        >
          📊 Dashboard
        </button>

        <button
          onClick={() =>
            navigate("/admin/students")
          }
          style={getBtnStyle(
            isActive("/admin/students")
          )}
        >
          👨‍🎓 Students
        </button>

        <button
          onClick={() =>
            navigate("/admin/hostels")
          }
          style={getBtnStyle(
            isActive("/admin/hostels")
          )}
        >
          🏢 Hostels
        </button>

        <button
          onClick={() =>
            navigate("/admin/rooms")
          }
          style={getBtnStyle(
            isActive("/admin/rooms")
          )}
        >
          🚪 Rooms
        </button>

        <button
          onClick={() =>
            navigate("/admin/allocation")
          }
          style={getBtnStyle(
            isActive("/admin/allocation")
          )}
        >
          ⚡ Smart Allocation
        </button>

        <button
          onClick={() =>
            navigate("/admin/payments")
          }
          style={getBtnStyle(
            isActive("/admin/payments")
          )}
        >
          💳 Payments
        </button>
        <button
          onClick={() => 
          navigate("/admin/allocation-history")}
>
  📜 Allocation History
</button>

        <button
          onClick={() =>
            navigate("/admin/maintenance")
          }
          style={getBtnStyle(
            isActive("/admin/maintenance")
          )}
        >
          🔧 Maintenance
        </button>

        {/* ADMIN CARD */}

        <div style={styles.adminCard}>
          <div style={styles.avatar}>
            {adminName.charAt(0)}
          </div>

          <div>
            <p style={styles.adminName}>
              {adminName}
            </p>

            <p style={styles.adminRole}>
              System Administrator
            </p>
          </div>
        </div>

        {/* LOGOUT */}

        <button
          style={styles.logout}
          onClick={logout}
        >
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

export default AdminLayout;

/* ================= STYLES ================= */

const styles = {
  container: {
    display: "flex",
    minHeight: "100vh",

    background:
      "radial-gradient(circle at top,#0F172A,#020617)",

    color: "#E2E8F0",

    fontFamily:
      "Inter,Segoe UI,sans-serif",
  },

  sidebar: {
    width: "280px",

    padding: "25px",

    display: "flex",
    flexDirection: "column",
    gap: "12px",

    background:
      "rgba(17,24,39,0.85)",

    backdropFilter: "blur(18px)",

    borderRight:
      "1px solid rgba(255,255,255,0.08)",

    boxShadow:
      "0 0 40px rgba(0,0,0,0.2)",
  },

  logo: {
    fontSize: "30px",

    fontWeight: "bold",

    color: "#38BDF8",

    marginBottom: "5px",

    letterSpacing: "1px",
  },

  subtitle: {
    color: "#94A3B8",

    fontSize: "12px",

    lineHeight: "18px",

    marginBottom: "15px",
  },

  systemBadge: {
    background:
      "rgba(34,197,94,0.15)",

    color: "#22C55E",

    padding: "8px 12px",

    borderRadius: "30px",

    width: "fit-content",

    fontSize: "12px",

    marginBottom: "20px",
  },

  btn: {
    padding: "13px 15px",

    borderRadius: "12px",

    border: "none",

    textAlign: "left",

    cursor: "pointer",

    transition: "0.25s",

    fontSize: "14px",
  },

  adminCard: {
    marginTop: "auto",

    background:
      "rgba(30,41,59,0.8)",

    borderRadius: "16px",

    padding: "15px",

    display: "flex",

    alignItems: "center",

    gap: "12px",

    border:
      "1px solid rgba(255,255,255,0.06)",
  },

  avatar: {
    width: "50px",

    height: "50px",

    borderRadius: "50%",

    background:
      "linear-gradient(135deg,#38BDF8,#0EA5E9)",

    display: "flex",

    justifyContent: "center",

    alignItems: "center",

    color: "#0F172A",

    fontWeight: "bold",

    fontSize: "20px",
  },

  adminName: {
    margin: 0,

    fontWeight: "600",

    fontSize: "14px",
  },

  adminRole: {
    margin: 0,

    fontSize: "12px",

    color: "#94A3B8",
  },

  logout: {
    marginTop: "15px",

    padding: "12px",

    borderRadius: "12px",

    border: "none",

    cursor: "pointer",

    fontWeight: "bold",

    background:
      "linear-gradient(135deg,#F4B400,#F59E0B)",

    color: "#0F172A",

    boxShadow:
      "0 10px 20px rgba(244,180,0,0.25)",
  },

  main: {
    flex: 1,

    padding: "35px",

    overflowY: "auto",

    background:
      "linear-gradient(180deg, rgba(15,23,42,0.4), rgba(2,6,23,0.8))",
  },
};