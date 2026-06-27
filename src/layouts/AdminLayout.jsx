import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { auth, db } from "../config/firebase";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import Logo from "../components/Logo";

function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [adminName, setAdminName] = useState("Administrator");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  // Close sidebar on navigation change (for mobile)
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const isActive = (path) =>
    location.pathname === path;

  const logout = async () => {
    await auth.signOut();
    navigate("/login");
  };

  const getBtnStyle = (active) => ({
    ...styles.btn,
    background: active
      ? "linear-gradient(135deg, #38BDF8, #0EA5E9)"
      : "transparent",
    color: active
      ? "#0F172A"
      : "#94A3B8",
    fontWeight: active ? "600" : "500",
    boxShadow: active
      ? "0 8px 20px rgba(14, 165, 233, 0.3)"
      : "none",
  });

  return (
    <div className="app-container" style={styles.container}>
      <style>{`
        .nav-btn {
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .nav-btn:hover {
          transform: translateX(6px);
          color: #38BDF8 !important;
          background: rgba(56, 189, 248, 0.08) !important;
        }
        .nav-btn-active:hover {
          transform: translateX(6px);
          color: #0F172A !important;
          background: linear-gradient(135deg, #38BDF8, #0EA5E9) !important;
        }
        .sidebar-logout {
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        .sidebar-logout:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 24px rgba(245, 158, 11, 0.4) !important;
          filter: brightness(1.1);
        }

        @media (max-width: 768px) {
          .app-container {
            flex-direction: column !important;
          }
          .sidebar-aside {
            position: fixed !important;
            left: -280px !important;
            top: 0 !important;
            bottom: 0 !important;
            z-index: 1000 !important;
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
            box-shadow: none !important;
          }
          .sidebar-aside-open {
            transform: translateX(280px) !important;
            box-shadow: 10px 0 30px rgba(0, 0, 0, 0.5) !important;
          }
          .main-content {
            padding: 20px 16px !important;
            height: calc(100vh - 60px) !important;
          }
        }
      `}</style>

      {/* MOBILE HEADER */}
      <header style={styles.mobileHeader}>
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          style={styles.hamburgerBtn}
        >
          ☰
        </button>
        <Logo size={28} textColor="#38BDF8" fontSize="20px" />
        <div style={styles.mobileAvatar}>
          {adminName.charAt(0)}
        </div>
      </header>

      {/* BACKDROP OVERLAY */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          style={styles.overlay}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`sidebar-aside ${isMobileMenuOpen ? "sidebar-aside-open" : ""}`}
        style={styles.sidebar}
      >
        {/* LOGO */}
        <div style={styles.logoContainer}>
          <div style={{ marginBottom: "8px" }}>
            <Logo size={36} textColor="#38BDF8" fontSize="24px" />
          </div>
          <p style={styles.subtitle}>
            Smart Hostel Allocation & Maintenance System
          </p>
          <div style={styles.systemBadge}>
            <span style={styles.statusDot}>●</span> System Online
          </div>
        </div>

        {/* NAVIGATION */}
        <div style={styles.navGroup}>
          <button
            onClick={() => navigate("/admin/dashboard")}
            className={isActive("/admin/dashboard") ? "nav-btn nav-btn-active" : "nav-btn"}
            style={getBtnStyle(isActive("/admin/dashboard"))}
          >
            📊 Dashboard
          </button>

          <button
            onClick={() => navigate("/admin/students")}
            className={isActive("/admin/students") ? "nav-btn nav-btn-active" : "nav-btn"}
            style={getBtnStyle(isActive("/admin/students"))}
          >
            👨‍🎓 Students
          </button>

          <button
            onClick={() => navigate("/admin/hostels")}
            className={isActive("/admin/hostels") ? "nav-btn nav-btn-active" : "nav-btn"}
            style={getBtnStyle(isActive("/admin/hostels"))}
          >
            🏢 Hostels
          </button>

          <button
            onClick={() => navigate("/admin/rooms")}
            className={isActive("/admin/rooms") ? "nav-btn nav-btn-active" : "nav-btn"}
            style={getBtnStyle(isActive("/admin/rooms"))}
          >
            🚪 Rooms
          </button>

          <button
            onClick={() => navigate("/admin/allocation")}
            className={isActive("/admin/allocation") ? "nav-btn nav-btn-active" : "nav-btn"}
            style={getBtnStyle(isActive("/admin/allocation"))}
          >
            ⚡ Smart Allocation
          </button>

          <button
            onClick={() => navigate("/admin/payments")}
            className={isActive("/admin/payments") ? "nav-btn nav-btn-active" : "nav-btn"}
            style={getBtnStyle(isActive("/admin/payments"))}
          >
            💳 Payments
          </button>

          <button
            onClick={() => navigate("/admin/allocation-history")}
            className={isActive("/admin/allocation-history") ? "nav-btn nav-btn-active" : "nav-btn"}
            style={getBtnStyle(isActive("/admin/allocation-history"))}
          >
            📜 Allocation History
          </button>

          <button
            onClick={() => navigate("/admin/maintenance")}
            className={isActive("/admin/maintenance") ? "nav-btn nav-btn-active" : "nav-btn"}
            style={getBtnStyle(isActive("/admin/maintenance"))}
          >
            🔧 Maintenance
          </button>
        </div>

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
          className="sidebar-logout"
          style={styles.logout}
          onClick={logout}
        >
          Logout
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content" style={styles.main}>
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
    background: "radial-gradient(circle at top, #0c1222, #020617)",
    color: "#E2E8F0",
    fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
  },

  sidebar: {
    width: "280px",
    padding: "30px 20px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    background: "rgba(10, 15, 30, 0.85)",
    backdropFilter: "blur(25px)",
    borderRight: "1px solid rgba(255, 255, 255, 0.05)",
    boxShadow: "10px 0 30px rgba(0, 0, 0, 0.3)",
    height: "100vh",
    boxSizing: "border-box",
    position: "sticky",
    top: 0,
  },

  logoContainer: {
    padding: "0 10px",
    marginBottom: "15px",
  },

  subtitle: {
    color: "#64748B",
    fontSize: "11px",
    lineHeight: "1.5",
    margin: "8px 0 15px 0",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },

  systemBadge: {
    background: "rgba(16, 185, 129, 0.1)",
    color: "#10B981",
    padding: "6px 14px",
    borderRadius: "20px",
    width: "fit-content",
    fontSize: "11.5px",
    fontWeight: "600",
    letterSpacing: "0.5px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    border: "1px solid rgba(16, 185, 129, 0.15)",
  },

  statusDot: {
    fontSize: "8px",
  },

  navGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    overflowY: "auto",
    paddingRight: "4px",
    flex: 1,
  },

  btn: {
    padding: "11px 16px",
    borderRadius: "12px",
    border: "none",
    textAlign: "left",
    cursor: "pointer",
    fontSize: "13.5px",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    width: "100%",
  },

  adminCard: {
    marginTop: "20px",
    background: "rgba(30, 41, 59, 0.4)",
    borderRadius: "16px",
    padding: "14px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    border: "1px solid rgba(255, 255, 255, 0.04)",
  },

  avatar: {
    width: "42px",
    height: "42px",
    borderRadius: "12px",
    background: "linear-gradient(135deg, #38BDF8, #0EA5E9)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    color: "#0F172A",
    fontWeight: "bold",
    fontSize: "18px",
    fontFamily: "'Outfit', sans-serif",
  },

  adminName: {
    margin: 0,
    fontWeight: "600",
    fontSize: "13px",
    color: "#F8FAFC",
  },

  adminRole: {
    margin: 0,
    fontSize: "11px",
    color: "#64748B",
  },

  logout: {
    marginTop: "12px",
    padding: "12px",
    borderRadius: "12px",
    border: "none",
    cursor: "pointer",
    fontWeight: "bold",
    background: "linear-gradient(135deg, #F4B400, #D97706)",
    color: "#0F172A",
    fontSize: "13.5px",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    boxShadow: "0 4px 15px rgba(244, 180, 0, 0.2)",
    width: "100%",
  },

  main: {
    flex: 1,
    padding: "40px",
    overflowY: "auto",
    background: "linear-gradient(180deg, rgba(15, 23, 42, 0.1) 0%, rgba(2, 6, 23, 0.6) 100%)",
    height: "100vh",
    boxSizing: "border-box",
  },

  // MOBILE ELEMENTS
  mobileHeader: {
    display: "none",
    height: "60px",
    background: "rgba(10, 15, 30, 0.8)",
    backdropFilter: "blur(15px)",
    borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
    padding: "0 16px",
    alignItems: "center",
    justifyContent: "space-between",
    position: "sticky",
    top: 0,
    zIndex: 999,
  },

  hamburgerBtn: {
    background: "transparent",
    border: "none",
    color: "#38BDF8",
    fontSize: "24px",
    cursor: "pointer",
    padding: "4px 8px",
  },

  mobileAvatar: {
    width: "32px",
    height: "32px",
    borderRadius: "8px",
    background: "linear-gradient(135deg, #38BDF8, #0EA5E9)",
    color: "#0F172A",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    fontSize: "14px",
    fontFamily: "'Outfit', sans-serif",
  },

  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0, 0, 0, 0.6)",
    backdropFilter: "blur(4px)",
    zIndex: 998,
  }
};