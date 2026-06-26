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
        .action-btn {
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        .action-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(56, 189, 248, 0.3) !important;
          filter: brightness(1.05);
        }
        .action-btn:active:not(:disabled) {
          transform: translateY(1px);
        }
      `}</style>

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
            className="form-input"
            style={styles.input}
            required
          />

          <label style={styles.label}>Payment Reference</label>
          <input
            type="text"
            placeholder="e.g ABC123XYZ"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            className="form-input"
            style={styles.input}
            required
          />

          {message && (
            <p style={styles.message}>{message}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="action-btn"
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
          Payments will be reviewed by the admin before hostel allocation is approved. Please ensure the payment reference corresponds to the receipt copy.
        </p>
      </div>
    </div>
  );
}

export default PaymentVerification;

/* ================= STYLES ================= */

const styles = {
  container: {
    color: "#E2E8F0",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },

  title: {
    fontSize: "28px",
    color: "#F8FAFC",
    marginBottom: "5px",
    fontFamily: "'Outfit', sans-serif",
  },

  subtitle: {
    color: "#64748B",
    marginBottom: "25px",
    fontSize: "14.5px",
  },

  card: {
    backgroundColor: "rgba(30, 41, 59, 0.45)",
    padding: "30px",
    borderRadius: "16px",
    border: "1px solid rgba(255, 255, 255, 0.04)",
    maxWidth: "600px",
    marginBottom: "25px",
    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },

  label: {
    color: "#E2E8F0",
    fontWeight: "600",
    fontSize: "13.5px",
  },

  input: {
    padding: "13px 16px",
    borderRadius: "12px",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    backgroundColor: "rgba(10, 15, 30, 0.6)",
    color: "#F8FAFC",
    outline: "none",
    fontSize: "14px",
    boxSizing: "border-box",
    width: "100%",
  },

  button: {
    padding: "14px",
    border: "none",
    borderRadius: "12px",
    background: "linear-gradient(135deg, #38BDF8, #0EA5E9)",
    color: "#0F172A",
    fontWeight: "700",
    cursor: "pointer",
    fontSize: "14.5px",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    boxShadow: "0 6px 20px rgba(56, 189, 248, 0.15)",
    marginTop: "8px",
  },

  message: {
    padding: "12px",
    borderRadius: "10px",
    backgroundColor: "rgba(56, 189, 248, 0.08)",
    color: "#38BDF8",
    border: "1px solid rgba(56, 189, 248, 0.2)",
    fontSize: "13.5px",
    lineHeight: "1.4",
  },

  infoCard: {
    backgroundColor: "rgba(15, 23, 42, 0.3)",
    border: "1px solid rgba(255, 255, 255, 0.03)",
    padding: "20px",
    borderRadius: "16px",
    maxWidth: "600px",
  },

  infoTitle: {
    color: "#38BDF8",
    margin: "0 0 8px 0",
    fontFamily: "'Outfit', sans-serif",
    fontSize: "16px",
  },

  infoText: {
    color: "#64748B",
    fontSize: "13px",
    margin: 0,
    lineHeight: "1.5",
  },
};