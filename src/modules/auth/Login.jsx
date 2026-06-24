import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../config/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

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

      alert("Login successful ✔");

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
      <div style={styles.card}>

        <h1 style={styles.logo}>SHAMMS</h1>
        <p style={styles.subtitle}>
          Smart Hostel Allocation & Maintenance System
        </p>

        <form onSubmit={handleLogin} style={styles.form}>

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
            required
          />

          {/* PASSWORD */}
          <div style={styles.passwordBox}>
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

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>

          {/* ADMIN ENTRY LINK */}
          <p
            onClick={() => navigate("/admin-login")}
            style={styles.adminLink}
          >
            Login as Admin
          </p>

        </form>

      </div>
    </div>
  );
}

export default Login;

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #0F172A, #111827)",
  },

  card: {
    width: "380px",
    padding: "35px",
    borderRadius: "16px",
    background: "#1E293B",
    boxShadow: "0 15px 35px rgba(0,0,0,0.4)",
    border: "1px solid rgba(255,255,255,0.05)",
    textAlign: "center",
  },

  logo: {
    color: "#F4B400",
    marginBottom: "5px",
    letterSpacing: "2px",
  },

  subtitle: {
    fontSize: "12px",
    color: "#94A3B8",
    marginBottom: "25px",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },

  input: {
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #334155",
    background: "#0F172A",
    color: "#E2E8F0",
    outline: "none",
    width: "100%",
  },

  passwordBox: {
    position: "relative",
  },

  toggle: {
    position: "absolute",
    right: "12px",
    top: "12px",
    fontSize: "12px",
    color: "#38BDF8",
    cursor: "pointer",
    userSelect: "none",
  },

  button: {
    padding: "12px",
    background: "#F4B400",
    border: "none",
    borderRadius: "8px",
    fontWeight: "bold",
    cursor: "pointer",
    color: "#0F172A",
  },

  error: {
    color: "#EF4444",
    fontSize: "12px",
  },

  adminLink: {
    marginTop: "12px",
    fontSize: "12px",
    color: "#38BDF8",
    cursor: "pointer",
  },
};