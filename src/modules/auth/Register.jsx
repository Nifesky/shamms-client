import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../../config/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { ADMIN_CODE } from "../../config/adminConfig";
import Logo from "../../components/Logo";

function Register() {
  const navigate = useNavigate();

  // BASIC INFO
  const [fullName, setFullName] = useState("");
  const [matricNo, setMatricNo] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // ROLE
  const [role, setRole] = useState("student");
  const [adminCode, setAdminCode] = useState("");

  // ALLOCATION INFO (STUDENTS)
  const [level, setLevel] = useState("");
  const [gender, setGender] = useState("");
  const [courseOfStudy, setCourseOfStudy] = useState("");
  const [customCourse, setCustomCourse] = useState("");
  const [preferredCapacity, setPreferredCapacity] = useState("");

  // UI STATES
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      const finalCourse = courseOfStudy === "Other" ? customCourse : courseOfStudy;

      await setDoc(doc(db, "users", user.uid), {
        fullName,
        matricNo: role === "student" ? matricNo : "ADMIN",
        email,
        role,

        // STUDENT ALLOCATION DATA
        level: role === "student" ? level : null,
        gender: role === "student" ? gender : null,
        courseOfStudy: role === "student" ? finalCourse : null,
        preferredCapacity:
          role === "student" ? Number(preferredCapacity) : null,

        roomAssigned: false,
        roomId: null,
        hostelId: null,
        paymentStatus: "pending",

        createdAt: new Date().toISOString(),
      });

      alert("Account created successfully ✔");
      navigate("/login");
    } catch (err) {
      setError(err.message);
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
        .role-btn {
          transition: all 0.2s ease !important;
          cursor: pointer;
        }
        .role-btn:hover {
          background: rgba(56, 189, 248, 0.15) !important;
          color: #38BDF8 !important;
        }
        .role-btn-active:hover {
          background: #38BDF8 !important;
          color: #0F172A !important;
        }
        .text-link {
          transition: all 0.2s ease !important;
        }
        .text-link:hover {
          color: #38BDF8 !important;
          text-decoration: none;
        }
        @media (max-width: 480px) {
          .auth-card {
            padding: 30px 20px !important;
            border-radius: 16px !important;
          }
        }
      `}</style>

      <div className="auth-card" style={styles.card}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "12px" }}>
          <Logo size={42} textColor="#38BDF8" fontSize="24px" />
        </div>
        <p style={styles.subtitle}>Smart Hostel Allocation System</p>

        {/* ROLE SELECT */}
        <div style={styles.roleBox}>
          <button
            type="button"
            onClick={() => setRole("student")}
            className={role === "student" ? "role-btn role-btn-active" : "role-btn"}
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
            className={role === "admin" ? "role-btn role-btn-active" : "role-btn"}
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
            className="form-input"
            style={styles.input}
            required
          />

          {role === "student" && (
            <input
              placeholder="Matric Number"
              value={matricNo}
              onChange={(e) => setMatricNo(e.target.value)}
              className="form-input"
              style={styles.input}
              required
            />
          )}

          {role === "student" && (
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="form-input"
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

          {role === "student" && (
            <select
              value={courseOfStudy}
              onChange={(e) => setCourseOfStudy(e.target.value)}
              className="form-input"
              style={styles.input}
              required
            >
              <option value="">Select Course of Study</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Software Engineering">Software Engineering</option>
              <option value="Microbiology">Microbiology</option>
              <option value="Biochemistry">Biochemistry</option>
              <option value="Accounting">Accounting</option>
              <option value="Economics">Economics</option>
              <option value="Mass Communication">Mass Communication</option>
              <option value="Electrical Engineering">Electrical Engineering</option>
              <option value="Mechanical Engineering">Mechanical Engineering</option>
              <option value="Medicine">Medicine & Surgery</option>
              <option value="Nursing">Nursing Science</option>
              <option value="Law">Law</option>
              <option value="Other">Other...</option>
            </select>
          )}

          {role === "student" && courseOfStudy === "Other" && (
            <input
              placeholder="Specify Course of Study"
              value={customCourse}
              onChange={(e) => setCustomCourse(e.target.value)}
              className="form-input"
              style={styles.input}
              required
            />
          )}

          {role === "student" && (
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="form-input"
              style={styles.input}
              required
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          )}

          {role === "student" && (
            <select
              value={preferredCapacity}
              onChange={(e) => setPreferredCapacity(e.target.value)}
              className="form-input"
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
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="form-input"
            style={styles.input}
            required
          />

          <div style={{ position: "relative", width: "100%" }}>
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

          {role === "admin" && (
            <input
              placeholder="Admin Code"
              value={adminCode}
              onChange={(e) => setAdminCode(e.target.value)}
              className="form-input"
              style={styles.input}
              required
            />
          )}

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" className="auth-btn" style={styles.button} disabled={loading}>
            {loading ? "Creating..." : "Create Account"}
          </button>

          <p style={styles.linkText}>
            Already have an account?{" "}
            <span onClick={() => navigate("/login")} className="text-link" style={styles.link}>
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
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "radial-gradient(circle at top, #0f182c, #020617)",
    padding: "40px 20px",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    boxSizing: "border-box",
  },
  card: {
    width: "100%",
    maxWidth: "440px",
    padding: "40px 35px",
    background: "rgba(20, 26, 46, 0.75)",
    backdropFilter: "blur(20px)",
    borderRadius: "24px",
    border: "1px solid rgba(255, 255, 255, 0.06)",
    color: "#E2E8F0",
    boxShadow: "0 20px 50px rgba(0, 0, 0, 0.35)",
    boxSizing: "border-box",
  },
  subtitle: {
    textAlign: "center",
    fontSize: "13px",
    color: "#64748B",
    margin: "0 0 25px 0",
  },
  form: { display: "flex", flexDirection: "column", gap: "14px" },
  input: {
    padding: "13px 16px",
    borderRadius: "12px",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    background: "rgba(10, 15, 30, 0.6)",
    color: "#F8FAFC",
    width: "100%",
    fontSize: "14px",
    boxSizing: "border-box",
  },
  button: {
    padding: "14px",
    background: "linear-gradient(135deg, #38BDF8, #0EA5E9)",
    border: "none",
    borderRadius: "12px",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "15px",
    color: "#0F172A",
    boxShadow: "0 6px 20px rgba(56, 189, 248, 0.15)",
    width: "100%",
    marginTop: "5px",
  },
  roleBox: { display: "flex", gap: "10px", marginBottom: "18px" },
  roleBtn: {
    flex: 1,
    padding: "11px",
    borderRadius: "10px",
    border: "1px solid rgba(56, 189, 248, 0.3)",
    fontSize: "14px",
    fontWeight: "600",
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
  error: { color: "#F87171", fontSize: "12.5px", margin: 0, textAlign: "left" },
  linkText: { textAlign: "center", fontSize: "13px", color: "#64748B", margin: "8px 0 0 0" },
  link: { color: "#38BDF8", cursor: "pointer", fontWeight: "600" },
};