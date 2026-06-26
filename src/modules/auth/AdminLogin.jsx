import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../config/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import Logo from "../../components/Logo";

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminCode, setAdminCode] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const VALID_ADMIN_CODE = "SHAMMS-ADMIN-2026";

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 🔐 STEP 1: ADMIN CODE CHECK
      if (adminCode !== VALID_ADMIN_CODE) {
        throw new Error("Invalid admin access code");
      }

      // 🔐 STEP 2: AUTHENTICATION
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCredential.user;

      // 🔐 STEP 3: VERIFY ROLE IN FIRESTORE
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        throw new Error("Account not found in database");
      }

      const userData = userSnap.data();

      if (userData.role !== "admin") {
        throw new Error("Access denied: Not an admin account");
      }

      alert("Welcome Admin ✔");

      navigate("/admin/dashboard");

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
          box-shadow: 0 10px 22px rgba(56, 189, 248, 0.25) !important;
          filter: brightness(1.05);
        }
        .auth-btn:active:not(:disabled) {
          transform: translateY(1px);
        }
        .text-link {
          transition: all 0.2s ease !important;
        }
        .text-link:hover {
          color: #38BDF8 !important;
          text-decoration: underline;
        }
      `}</style>

      <div style={styles.card}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "12px" }}>
          <Logo size={42} textColor="#38BDF8" fontSize="26px" />
        </div>
        <p style={styles.subtitle}>Secure Administration Portal</p>

        <form onSubmit={handleAdminLogin} style={styles.form}>
          <input
            type="email"
            placeholder="Admin Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="form-input"
            style={styles.input}
            required
          />

          {/* PASSWORD WITH TOGGLE */}
          <div style={styles.passwordWrapper}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
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

          <input
            type="password"
            placeholder="Admin Access Code"
            value={adminCode}
            onChange={(e) => setAdminCode(e.target.value)}
            className="form-input"
            style={styles.input}
            required
          />

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" className="auth-btn" style={styles.button} disabled={loading}>
            {loading ? "Verifying..." : "Access Admin Panel"}
          </button>

          <p onClick={() => navigate("/login")} className="text-link" style={styles.back}>
            ← Back to Student Login
          </p>
        </form>
      </div>
    </div>
  );
}

export default AdminLogin;

const styles = {
  container: {
    height: "100vh",
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
    textAlign: "center",
    color: "#E2E8F0",
    boxShadow: "0 20px 50px rgba(0, 0, 0, 0.35)",
    boxSizing: "border-box",
  },

  subtitle: {
    fontSize: "13px",
    color: "#64748B",
    margin: "0 0 25px 0",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },

  input: {
    padding: "13px 16px",
    borderRadius: "12px",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    background: "rgba(10, 15, 30, 0.6)",
    color: "#F8FAFC",
    outline: "none",
    width: "100%",
    fontSize: "14px",
    boxSizing: "border-box",
  },

  button: {
    padding: "14px",
    background: "#38BDF8",
    border: "none",
    borderRadius: "12px",
    fontWeight: "bold",
    cursor: "pointer",
    color: "#0F172A",
    fontSize: "15px",
    boxShadow: "0 6px 20px rgba(56, 189, 248, 0.2)",
    width: "100%",
    marginTop: "5px",
  },

  error: {
    color: "#F87171",
    fontSize: "12.5px",
    margin: 0,
    textAlign: "left",
  },

  back: {
    marginTop: "12px",
    fontSize: "13.5px",
    color: "#38BDF8",
    cursor: "pointer",
    fontWeight: "600",
  },

  passwordWrapper: {
    position: "relative",
    width: "100%",
  },

  toggle: {
    position: "absolute",
    right: "16px",
    top: "14px",
    fontSize: "12.5px",
    cursor: "pointer",
    color: "#38BDF8",
    fontWeight: "600",
    userSelect: "none",
  },
};