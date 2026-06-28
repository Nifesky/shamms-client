import { useEffect, useState, useRef } from "react";
import { auth, db } from "../../config/firebase";
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  addDoc,
  collection,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";

function PaymentVerification() {
  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [timerText, setTimerText] = useState("");

  const navigate = useNavigate();
  const timerIntervalRef = useRef(null);

  const fetchReservation = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        navigate("/login");
        return;
      }

      // Check for reservation doc named after student uid
      const resSnap = await getDoc(doc(db, "reservations", user.uid));

      if (resSnap.exists()) {
        const resData = resSnap.data();

        // Check if expired (unless status is already payment_submitted)
        const isExpired = new Date(resData.expiresAt) <= new Date();

        if (isExpired && resData.status === "reserved") {
          // Delete expired hold
          await deleteDoc(doc(db, "reservations", user.uid));
          setReservation(null);
        } else {
          // Resolve details
          const hSnap = await getDoc(doc(db, "hostels", resData.hostelId));
          const rSnap = await getDoc(doc(db, "rooms", resData.roomId));

          setReservation({
            ...resData,
            hostelName: hSnap.exists() ? hSnap.data().hostelName : "Unknown Hostel",
            roomNumber: rSnap.exists() ? rSnap.data().roomNumber : "Unknown Room",
            price: hSnap.exists() ? hSnap.data().hostelPrice : 0,
          });

          // Pre-fill amount
          if (hSnap.exists()) {
            setAmount(hSnap.data().hostelPrice.toString());
          }
        }
      } else {
        setReservation(null);
      }
    } catch (err) {
      console.log("Error loading reservation info:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReservation();
    return () => clearInterval(timerIntervalRef.current);
  }, []);

  // START COUNTDOWN TIMER IF RESERVATION STATUS IS "reserved"
  useEffect(() => {
    if (reservation && reservation.status === "reserved") {
      clearInterval(timerIntervalRef.current);
      const targetTime = new Date(reservation.expiresAt).getTime();

      const updateTimer = () => {
        const now = new Date().getTime();
        const diff = targetTime - now;

        if (diff <= 0) {
          clearInterval(timerIntervalRef.current);
          setTimerText("Expired!");
          setReservation(null);
          // Delete in DB
          const user = auth.currentUser;
          if (user) {
            deleteDoc(doc(db, "reservations", user.uid)).then(() => {
              fetchReservation();
            });
          }
        } else {
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          setTimerText(`${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`);
        }
      };

      updateTimer();
      timerIntervalRef.current = setInterval(updateTimer, 1000);
    } else {
      clearInterval(timerIntervalRef.current);
      setTimerText("");
    }
    return () => clearInterval(timerIntervalRef.current);
  }, [reservation]);

  // SUBMIT PAYMENT FOR RESERVED ROOM
  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    if (!reservation) return;

    setSubmitting(true);
    setMessage("");

    try {
      const user = auth.currentUser;
      if (!user) return;

      // 1. Create payment submission document
      await addDoc(collection(db, "payments"), {
        studentId: user.uid,
        amount: Number(amount),
        reference,
        roomId: reservation.roomId,
        hostelId: reservation.hostelId,
        status: "pending",
        createdAt: new Date().toISOString(),
      });

      // 2. Update reservation status to prevent expiration releases
      await setDoc(
        doc(db, "reservations", user.uid),
        { status: "payment_submitted" },
        { merge: true }
      );

      // 3. Update user payment status to pending review
      await setDoc(
        doc(db, "users", user.uid),
        { paymentStatus: "pending" },
        { merge: true }
      );

      setMessage("✔ Proof of payment uploaded successfully. Your room reservation is locked pending approval.");
      await fetchReservation();
    } catch (err) {
      console.log(err);
      setMessage("❌ Submission failed: " + err.message);
    }
    setSubmitting(false);
  };

  if (loading) {
    return <div style={styles.loading}>Loading verification center...</div>;
  }

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
        .allocate-link-btn {
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        .allocate-link-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(14, 165, 233, 0.25) !important;
          filter: brightness(1.05);
        }
      `}</style>

      {/* TITLE */}
      <h1 style={styles.title}>Payment Verification</h1>
      <p style={styles.subtitle}>
        Verify your hostel reservation by uploading your transaction reference
      </p>

      {/* NO ACTIVE RESERVATION CARD */}
      {!reservation && (
        <div style={styles.alertCard}>
          <div style={{ fontSize: "32px" }}>⚠️</div>
          <h3 style={{ margin: "0 0 8px 0", color: "#F59E0B", fontFamily: "'Outfit', sans-serif" }}>
            Room Reservation Required
          </h3>
          <p style={{ margin: "0 0 20px 0", color: "#94A3B8", fontSize: "14px", lineHeight: "1.6" }}>
            You do not currently have an active room hold. You must select and temporarily reserve a room space first before you can submit a payment verification request.
          </p>
          <button
            onClick={() => navigate("/student/hostel-allocation")}
            className="allocate-link-btn"
            style={styles.linkButton}
          >
            Go to Room Selection 🏢
          </button>
        </div>
      )}

      {/* ACTIVE RESERVATION SECURED & PENDING APPROVAL */}
      {reservation && reservation.status === "payment_submitted" && (
        <div style={styles.successAlert}>
          <div style={{ fontSize: "32px" }}>⏳</div>
          <h3 style={{ margin: "0 0 8px 0", color: "#34D399", fontFamily: "'Outfit', sans-serif" }}>
            Payment Review in Progress
          </h3>
          <p style={{ margin: "0 0 15px 0", color: "#E2E8F0", fontSize: "14px", lineHeight: "1.6" }}>
            Your payment reference has been submitted. Your reserved space in <strong>Room {reservation.roomNumber}</strong> (Hostel: {reservation.hostelName}) is locked and held for you.
          </p>
          <div style={styles.badgeInfo}>
            Status: <strong>Pending Administrator Review</strong>
          </div>
        </div>
      )}

      {/* RESERVED ROOM FORM */}
      {reservation && reservation.status === "reserved" && (
        <div style={styles.splitLayout}>
          {/* FORM */}
          <div style={styles.card}>
            <div style={styles.formHeader}>
              <h3 style={{ margin: 0, fontFamily: "'Outfit', sans-serif" }}>Submit Payment Details</h3>
              <div style={styles.timerBadge}>{timerText}</div>
            </div>

            <form onSubmit={handleSubmitPayment} style={styles.form}>
              <label style={styles.label}>Amount Paid (₦)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="form-input"
                style={styles.input}
                required
                disabled
              />

              <label style={styles.label}>Payment Transaction Reference</label>
              <input
                type="text"
                placeholder="e.g. TXN-10928374-REF"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="form-input"
                style={styles.input}
                required
              />

              {message && (
                <p style={{
                  ...styles.message,
                  color: message.startsWith("✔") ? "#34D399" : "#EF4444",
                  background: message.startsWith("✔") ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
                  borderColor: message.startsWith("✔") ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)",
                }}>{message}</p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="action-btn"
                style={styles.button}
              >
                {submitting ? "Submitting Request..." : "Secure My Room Space 🔒"}
              </button>
            </form>
          </div>

          {/* RESERVATION INFO CARD */}
          <div style={styles.infoCard}>
            <h3 style={styles.infoTitle}>Held Room Details</h3>
            <div style={styles.infoMeta}>
              <div style={styles.infoRow}>
                <span>Hostel Name:</span>
                <strong>{reservation.hostelName}</strong>
              </div>
              <div style={styles.infoRow}>
                <span>Room Number:</span>
                <strong>Room {reservation.roomNumber}</strong>
              </div>
              <div style={styles.infoRow}>
                <span>Hold Ends At:</span>
                <strong>{new Date(reservation.expiresAt).toLocaleTimeString()}</strong>
              </div>
            </div>
            <div style={styles.warningBox}>
              Please transfer exactly <strong>₦{Number(reservation.price).toLocaleString()}</strong> to the official institution account, then upload the receipt reference before the countdown expires. Failing to do so will release this space.
            </div>
          </div>
        </div>
      )}
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
    color: "#38BDF8",
    marginBottom: "5px",
    fontFamily: "'Outfit', sans-serif",
  },

  subtitle: {
    color: "#64748B",
    marginBottom: "25px",
    fontSize: "14.5px",
  },

  alertCard: {
    backgroundColor: "rgba(30, 41, 59, 0.4)",
    padding: "40px 30px",
    borderRadius: "20px",
    border: "1px solid rgba(245, 158, 11, 0.2)",
    maxWidth: "600px",
    textAlign: "center",
    margin: "20px auto 0 auto",
    boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
  },

  linkButton: {
    padding: "13px 28px",
    background: "linear-gradient(135deg,#38BDF8,#0EA5E9)",
    color: "#0F172A",
    border: "none",
    borderRadius: "12px",
    fontWeight: "700",
    cursor: "pointer",
    fontSize: "14.5px",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },

  successAlert: {
    backgroundColor: "rgba(16, 185, 129, 0.08)",
    padding: "35px 25px",
    borderRadius: "20px",
    border: "1px solid rgba(16, 185, 129, 0.25)",
    maxWidth: "600px",
    margin: "20px auto 0 auto",
    boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
  },

  badgeInfo: {
    background: "rgba(16, 185, 129, 0.15)",
    border: "1px solid rgba(16, 185, 129, 0.2)",
    color: "#34D399",
    padding: "8px 16px",
    borderRadius: "30px",
    width: "fit-content",
    fontSize: "13px",
  },

  splitLayout: {
    display: "flex",
    gap: "25px",
    flexWrap: "wrap",
  },

  card: {
    backgroundColor: "rgba(30, 41, 59, 0.45)",
    padding: "30px 24px",
    borderRadius: "16px",
    border: "1px solid rgba(255, 255, 255, 0.04)",
    flex: "1 1 400px",
    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
    boxSizing: "border-box",
  },

  formHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    paddingBottom: "15px",
    marginBottom: "20px",
  },

  timerBadge: {
    background: "rgba(245,158,11,0.15)",
    color: "#FBBF24",
    border: "1px solid rgba(245,158,11,0.25)",
    padding: "6px 14px",
    borderRadius: "8px",
    fontWeight: "700",
    fontFamily: "monospace",
    fontSize: "14px",
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
    background: "linear-gradient(135deg, #10B981, #059669)",
    color: "#FFFFFF",
    fontWeight: "700",
    cursor: "pointer",
    fontSize: "14.5px",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    boxShadow: "0 6px 20px rgba(16, 185, 129, 0.25)",
    marginTop: "8px",
    width: "100%",
  },

  message: {
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid",
    fontSize: "13.5px",
    lineHeight: "1.4",
  },

  infoCard: {
    backgroundColor: "rgba(15, 23, 42, 0.3)",
    border: "1px solid rgba(255, 255, 255, 0.03)",
    padding: "25px",
    borderRadius: "16px",
    flex: "1 1 300px",
    boxSizing: "border-box",
    height: "fit-content",
  },

  infoTitle: {
    color: "#38BDF8",
    margin: "0 0 15px 0",
    fontFamily: "'Outfit', sans-serif",
    fontSize: "18px",
  },

  infoMeta: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    paddingBottom: "15px",
    marginBottom: "15px",
  },

  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "14px",
  },

  warningBox: {
    color: "#FBBF24",
    fontSize: "12.5px",
    lineHeight: "1.5",
    background: "rgba(245,158,11,0.05)",
    borderLeft: "3px solid #FBBF24",
    padding: "10px 14px",
  },

  loading: {
    color: "#E2E8F0",
    textAlign: "center",
    padding: "50px",
    fontSize: "16px",
  },
};