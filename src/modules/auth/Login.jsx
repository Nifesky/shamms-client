import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../config/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import Logo from "../../components/Logo";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCredential.user;

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        throw new Error("User profile not found");
      }

      const userData = userSnap.data();

      if (userData.role === "student") {
        navigate("/student/dashboard");
      } else if (userData.role === "admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/student/dashboard");
      }
    } catch (err) {
      setError(err.message || "Login failed");
    }

    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <style>{`
        .form-input {
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .form-input:focus {
          border-color: #38BDF8 !important;
          box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.15) !important;
          background: rgba(15, 23, 42, 0.95) !important;
        }
        .auth-btn {
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        .auth-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 22px rgba(244, 180, 0, 0.35) !important;
          filter: brightness(1.05);
        }
        .auth-btn:active:not(:disabled) {
          transform: translateY(1px);
        }
        .text-link {
          transition: all 0.2s ease !important;
        }
        .text-link:hover {
          color: #F59E0B !important;
          text-decoration: none;
          opacity: 0.9;
        }
        .admin-link-hover {
          transition: all 0.2s ease !important;
        }
        .admin-link-hover:hover {
          color: #F4B400 !important;
          opacity: 0.9;
        }
      `}</style>

      <div style={styles.card}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "12px" }}>
          <Logo size={46} textColor="#F4B400" fontSize="34px" />
        </div>

        <p style={styles.subtitle}>
          Smart Hostel Allocation & Maintenance Management System
        </p>
        <h3 style={styles.welcome}>
          Welcome Back 👋
        </h3>

        <form onSubmit={handleLogin} style={styles.form}>
          <input
            type="email"
            placeholder="Enter Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="form-input"
            style={styles.input}
            required
          />

          <div style={styles.passwordBox}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              style={styles.input}
              required
            />

            <span
              onClick={() => setShowPassword(!showPassword)}
              style={styles.toggle}
            >
              {showPassword ? "Hide" : "Show"}
            </span>
          </div>

          {error && (
            <p style={styles.error}>
              {error}
            </p>
          )}

          <button
            type="submit"
            className="auth-btn"
            style={styles.button}
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          <div style={styles.divider}>
            <span style={styles.dividerText}>OR</span>
          </div>

          <p
            onClick={() => navigate("/admin-login")}
            className="admin-link-hover"
            style={styles.adminLink}
          >
            Login as Administrator
          </p>

          <p style={styles.registerText}>
            Don't have an account?{" "}
            <span
              onClick={() => navigate("/register")}
              className="text-link"
              style={styles.registerLink}
            >
              Register
            </span>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Login;

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "radial-gradient(circle at top, #0f182c, #020617)",
    padding: "20px",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    boxSizing: "border-box",
  },

  card: {
    width: "440px",
    padding: "45px 35px",
    borderRadius: "24px",
    background: "rgba(20, 26, 46, 0.75)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(255, 255, 255, 0.06)",
    boxShadow: "0 20px 50px rgba(0, 0, 0, 0.35)",
    textAlign: "center",
    boxSizing: "border-box",
  },

  subtitle: {
    color: "#64748B",
    fontSize: "13px",
    lineHeight: "1.6",
    margin: "0 0 25px 0",
  },

  welcome: {
    color: "#F8FAFC",
    fontSize: "18px",
    fontWeight: "600",
    margin: "0 0 20px 0",
    fontFamily: "'Outfit', sans-serif",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },

  input: {
    width: "100%",
    padding: "13px 16px",
    borderRadius: "12px",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    background: "rgba(10, 15, 30, 0.6)",
    color: "#F8FAFC",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
  },

  passwordBox: {
    position: "relative",
    width: "100%",
  },

  toggle: {
    position: "absolute",
    right: "16px",
    top: "14px",
    color: "#38BDF8",
    cursor: "pointer",
    fontSize: "12.5px",
    fontWeight: "600",
    userSelect: "none",
  },

  button: {
    padding: "14px",
    border: "none",
    borderRadius: "12px",
    background: "linear-gradient(135deg, #F4B400, #D97706)",
    color: "#0F172A",
    fontWeight: "700",
    fontSize: "15px",
    cursor: "pointer",
    boxShadow: "0 6px 20px rgba(244, 180, 0, 0.15)",
    width: "100%",
  },

  error: {
    color: "#F87171",
    fontSize: "12.5px",
    margin: 0,
    textAlign: "left",
  },

  divider: {
    position: "relative",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    margin: "8px 0",
  },

  dividerText: {
    color: "#475569",
    fontSize: "12px",
    fontWeight: "600",
    background: "rgba(20, 26, 46, 0.9)",
    padding: "0 10px",
    zIndex: 1,
  },

  adminLink: {
    color: "#38BDF8",
    cursor: "pointer",
    fontSize: "13.5px",
    fontWeight: "600",
    margin: "4px 0 0 0",
  },

  registerText: {
    color: "#64748B",
    fontSize: "13.5px",
    margin: "12px 0 0 0",
  },

  registerLink: {
    color: "#F4B400",
    cursor: "pointer",
    fontWeight: "700",
  },
};