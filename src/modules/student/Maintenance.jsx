import { useState } from "react";
import { auth, db } from "../../config/firebase";
import { addDoc, collection } from "firebase/firestore";

function Maintenance() {
  const [roomId, setRoomId] = useState("");
  const [issue, setIssue] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const user = auth.currentUser;

      if (!user) {
        alert("Please login again");
        return;
      }

      await addDoc(collection(db, "maintenance_requests"), {
        studentId: user.uid,
        roomId: roomId,
        issueDescription: issue,
        status: "pending",
        dateCreated: new Date().toISOString(),
      });

      setMessage("Request submitted successfully");

      setRoomId("");
      setIssue("");
    } catch (error) {
      console.log(error.message);
      setMessage("Failed to submit request");
    }

    setLoading(false);
  };

  return (
    <div>
      <h1 style={styles.title}>Maintenance Center</h1>

      <p style={styles.subtitle}>
        Report hostel issues and track progress
      </p>

      <div style={styles.card}>
        <form onSubmit={handleSubmit} style={styles.form}>

          <label style={styles.label}>Room Number</label>
          <input
            type="text"
            placeholder="e.g A101"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            style={styles.input}
            required
          />

          <label style={styles.label}>Issue Description</label>
          <textarea
            placeholder="Describe the issue..."
            value={issue}
            onChange={(e) => setIssue(e.target.value)}
            style={styles.textarea}
            required
          />

          {message && (
            <p style={styles.message}>{message}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={styles.button}
          >
            {loading ? "Submitting..." : "Submit Request"}
          </button>
        </form>
      </div>

      <div style={styles.statusCard}>
        <h3 style={styles.statusTitle}>
          Your Requests
        </h3>

        <p style={styles.statusText}>
          Submitted maintenance requests will appear here once tracking is added.
        </p>
      </div>
    </div>
  );
}

export default Maintenance;

/* ================= STYLES ================= */

const styles = {
  title: {
    fontSize: "28px",
    color: "#F8FAFC",
    marginBottom: "5px",
  },

  subtitle: {
    color: "#94A3B8",
    marginBottom: "20px",
  },

  card: {
    backgroundColor: "#1E293B",
    padding: "25px",
    borderRadius: "12px",
    maxWidth: "650px",
    border: "1px solid rgba(255,255,255,0.05)",
    marginBottom: "20px",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },

  label: {
    color: "#E2E8F0",
    fontWeight: "600",
  },

  input: {
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #334155",
    backgroundColor: "#0F172A",
    color: "#E2E8F0",
    outline: "none",
  },

  textarea: {
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #334155",
    backgroundColor: "#0F172A",
    color: "#E2E8F0",
    minHeight: "120px",
    resize: "none",
    outline: "none",
  },

  button: {
    padding: "12px",
    border: "none",
    borderRadius: "8px",
    background: "linear-gradient(135deg, #38BDF8, #0EA5E9)",
    color: "#0F172A",
    fontWeight: "bold",
    cursor: "pointer",
  },

  message: {
    color: "#38BDF8",
    backgroundColor: "rgba(56,189,248,0.1)",
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid rgba(56,189,248,0.3)",
  },

  statusCard: {
    backgroundColor: "#1E293B",
    padding: "20px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.05)",
    maxWidth: "650px",
  },

  statusTitle: {
    color: "#38BDF8",
    marginBottom: "8px",
  },

  statusText: {
    color: "#94A3B8",
  },
};