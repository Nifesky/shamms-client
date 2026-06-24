import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../config/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

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
      <div style={styles.card}>

        <h1 style={styles.logo}>SHAMMS ADMIN</h1>
        <p style={styles.subtitle}>Secure Administration Portal</p>

        <form onSubmit={handleAdminLogin} style={styles.form}>

          <input
            type="email"
            placeholder="Admin Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            style={styles.input}
            required
          />

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? "Verifying..." : "Access Admin Panel"}
          </button>

          <p onClick={() => navigate("/login")} style={styles.back}>
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
    background: "linear-gradient(135deg, #0F172A, #111827)",
  },

  card: {
    width: "400px",
    padding: "30px",
    borderRadius: "12px",
    background: "#1E293B",
    border: "1px solid rgba(255,255,255,0.05)",
    textAlign: "center",
    color: "#E2E8F0",
  },

  logo: {
    color: "#38BDF8",
    marginBottom: "5px",
  },

  subtitle: {
    fontSize: "12px",
    color: "#94A3B8",
    marginBottom: "20px",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },

  input: {
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #334155",
    background: "#0F172A",
    color: "#E2E8F0",
    outline: "none",
  },

  button: {
    padding: "12px",
    background: "#38BDF8",
    border: "none",
    borderRadius: "8px",
    fontWeight: "bold",
    cursor: "pointer",
    color: "#0F172A",
  },

  error: {
    color: "#F87171",
    fontSize: "12px",
  },

  back: {
    marginTop: "10px",
    fontSize: "12px",
    color: "#38BDF8",
    cursor: "pointer",
  },

  passwordWrapper: {
    position: "relative",
  },

  toggle: {
    position: "absolute",
    right: "10px",
    top: "12px",
    fontSize: "12px",
    cursor: "pointer",
    color: "#38BDF8",
  },
};