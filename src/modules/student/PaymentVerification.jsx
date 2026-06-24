import { useState } from "react";
import { auth, db } from "../../config/firebase";
import { addDoc, collection } from "firebase/firestore";

function PaymentVerification() {
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
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

      await addDoc(collection(db, "payments"), {
        studentId: user.uid,
        amount,
        reference,
        status: "pending",
        createdAt: new Date().toISOString(),
      });

      setMessage("Payment submitted successfully (Pending verification)");

      // clear form
      setAmount("");
      setReference("");

    } catch (error) {
      console.log(error.message);
      setMessage("Failed to submit payment");
    }

    setLoading(false);
  };

  return (
    <div>
      {/* TITLE */}
      <h1 style={styles.title}>Payment Verification</h1>

      <p style={styles.subtitle}>
        Upload your hostel payment details for admin approval
      </p>

      {/* FORM CARD */}
      <div style={styles.card}>
        <form onSubmit={handleSubmit} style={styles.form}>

          <label style={styles.label}>Amount Paid</label>
          <input
            type="number"
            placeholder="e.g 50000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={styles.input}
            required
          />

          <label style={styles.label}>Payment Reference</label>
          <input
            type="text"
            placeholder="e.g ABC123XYZ"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            style={styles.input}
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
            {loading ? "Submitting..." : "Submit Payment"}
          </button>
        </form>
      </div>

      {/* INFO CARD */}
      <div style={styles.infoCard}>
        <h3 style={styles.infoTitle}>Important Notice</h3>
        <p style={styles.infoText}>
          Payments will be reviewed by the admin before hostel allocation is approved.
        </p>
      </div>
    </div>
  );
}

export default PaymentVerification;

/* ================= STYLES ================= */

const styles = {
  title: {
    fontSize: "28px",
    color: "#F8FAFC",
    marginBottom: "5px",
  },

  subtitle: {
    color: "#94A3B8",
    marginBottom: "25px",
  },

  card: {
    backgroundColor: "#1E293B",
    padding: "25px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.05)",
    maxWidth: "600px",
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
    padding: "10px",
    borderRadius: "8px",
    backgroundColor: "rgba(56,189,248,0.1)",
    color: "#38BDF8",
    border: "1px solid rgba(56,189,248,0.3)",
  },

  infoCard: {
    backgroundColor: "#0F172A",
    border: "1px solid #334155",
    padding: "15px",
    borderRadius: "10px",
    maxWidth: "600px",
  },

  infoTitle: {
    color: "#38BDF8",
    marginBottom: "5px",
  },

  infoText: {
    color: "#94A3B8",
  },
};