import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../../config/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { ADMIN_CODE } from "../../config/adminConfig";

function Register() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [matricNo, setMatricNo] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [role, setRole] = useState("student");
  const [adminCode, setAdminCode] = useState("");

  // NEW ALOLOCATION FIELDS
  const [level, setLevel] = useState("");
  const [gender, setGender] = useState("");
  const [preferredCapacity, setPreferredCapacity] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const getStrength = (pass) => {
    if (pass.length < 6) return "Weak";
    if (pass.length < 10) return "Medium";
    return "Strong";
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // ADMIN VALIDATION
      if (role === "admin" && adminCode !== ADMIN_CODE) {
        throw new Error("Invalid Admin Code");
      }

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        fullName,
        matricNo: role === "student" ? matricNo : "ADMIN",
        email,
        role,

        // allocation fields
        level: role === "student" ? level : null,
        gender: role === "student" ? gender : null,
        preferredCapacity:
          role === "student" ? Number(preferredCapacity) : null,

        roomAssigned: false,
        roomId: null,
        hostelId: null,

        paymentStatus: "pending",

        createdAt: new Date().toISOString(),
      });

      alert("Account created successfully ✔");

      // reset
      setFullName("");
      setMatricNo("");
      setEmail("");
      setPassword("");
      setAdminCode("");
      setLevel("");
      setGender("");
      setPreferredCapacity("");

      navigate("/login");
    } catch (err) {
      setError(err.message);
    }

    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>SHAMMS Register</h2>
        <p style={styles.subtitle}>Smart Hostel Allocation System</p>

        {/* ROLE SELECT */}
        <div style={styles.roleBox}>
          <button
            type="button"
            onClick={() => setRole("student")}
            style={{
              ...styles.roleBtn,
              background: role === "student" ? "#38BDF8" : "transparent",
              color: role === "student" ? "#0F172A" : "#E2E8F0",
            }}
          >
            Student
          </button>

          <button
            type="button"
            onClick={() => setRole("admin")}
            style={{
              ...styles.roleBtn,
              background: role === "admin" ? "#38BDF8" : "transparent",
              color: role === "admin" ? "#0F172A" : "#E2E8F0",
            }}
          >
            Admin
          </button>
        </div>

        <form onSubmit={handleRegister} style={styles.form}>
          <input
            placeholder="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            style={styles.input}
            required
          />

          {role === "student" && (
            <input
              placeholder="Matric Number"
              value={matricNo}
              onChange={(e) => setMatricNo(e.target.value)}
              style={styles.input}
              required
            />
          )}

          {/* LEVEL */}
          {role === "student" && (
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              style={styles.input}
              required
            >
              <option value="">Select Level</option>
              <option value="100">100 Level</option>
              <option value="200">200 Level</option>
              <option value="300">300 Level</option>
              <option value="400">400 Level</option>
            </select>
          )}

          {/* GENDER */}
          {role === "student" && (
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              style={styles.input}
              required
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          )}

          {/* ROOM TYPE */}
          {role === "student" && (
            <select
              value={preferredCapacity}
              onChange={(e) => setPreferredCapacity(e.target.value)}
              style={styles.input}
              required
            >
              <option value="">Room Preference</option>
              <option value="4">4-Man Room</option>
              <option value="6">6-Man Room</option>
              <option value="8">8-Man Room</option>
            </select>
          )}

          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
            required
          />

          {/* PASSWORD */}
          <div style={{ position: "relative" }}>
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

          {/* ADMIN CODE */}
          {role === "admin" && (
            <input
              placeholder="Admin Code"
              value={adminCode}
              onChange={(e) => setAdminCode(e.target.value)}
              style={styles.input}
              required
            />
          )}

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? "Creating..." : "Create Account"}
          </button>

          <p style={styles.linkText}>
            Already have an account?{" "}
            <span onClick={() => navigate("/login")} style={styles.link}>
              Login
            </span>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Register;

/* ================= STYLES ================= */

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "radial-gradient(circle at top, #0F172A, #020617)",
  },

  card: {
    width: "400px",
    padding: "25px",
    background: "rgba(30,41,59,0.9)",
    borderRadius: "14px",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "#E2E8F0",
    backdropFilter: "blur(10px)",
  },

  title: {
    textAlign: "center",
    color: "#38BDF8",
    marginBottom: "5px",
  },

  subtitle: {
    textAlign: "center",
    fontSize: "12px",
    color: "#94A3B8",
    marginBottom: "15px",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  input: {
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #334155",
    background: "#0F172A",
    color: "#E2E8F0",
    outline: "none",
  },

  button: {
    padding: "12px",
    background: "linear-gradient(135deg, #38BDF8, #0EA5E9)",
    border: "none",
    borderRadius: "8px",
    fontWeight: "bold",
    cursor: "pointer",
    color: "#0F172A",
  },

  roleBox: {
    display: "flex",
    gap: "10px",
    marginBottom: "10px",
  },

  roleBtn: {
    flex: 1,
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #38BDF8",
    cursor: "pointer",
  },

  toggle: {
    position: "absolute",
    right: "10px",
    top: "10px",
    fontSize: "12px",
    cursor: "pointer",
    color: "#38BDF8",
  },

  error: {
    color: "#F87171",
    fontSize: "12px",
  },

  linkText: {
    textAlign: "center",
    fontSize: "12px",
    color: "#94A3B8",
  },

  link: {
    color: "#38BDF8",
    cursor: "pointer",
    fontWeight: "bold",
  },
};