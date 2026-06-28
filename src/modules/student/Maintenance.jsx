import { useEffect, useState } from "react";
import { auth, db } from "../../config/firebase";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  query,
  where
} from "firebase/firestore";

function Maintenance() {
  const [roomId, setRoomId] = useState("");
  const [category, setCategory] = useState("Plumbing");
  const [issue, setIssue] = useState("");
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  // Feedback Questionnaire state
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [feedbackAction, setFeedbackAction] = useState(null); // 'resolve' or 'reopen'
  const [rating, setRating] = useState(5);
  const [feedbackComments, setFeedbackComments] = useState("");
  const [reopenNotes, setReopenNotes] = useState("");
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);

  const fetchRequests = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      // 1. Fetch user to auto-fill room info if possible
      const userSnap = await getDoc(doc(db, "users", user.uid));
      if (userSnap.exists()) {
        const uData = userSnap.data();
        if (uData.roomAssigned && uData.roomId) {
          const roomSnap = await getDoc(doc(db, "rooms", uData.roomId));
          if (roomSnap.exists()) {
            setRoomId(roomSnap.data().roomNumber);
          }
        }
      }

      // 2. Fetch requests submitted by this student
      const q = query(
        collection(db, "maintenance_requests"),
        where("studentId", "==", user.uid)
      );
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Sort requests (newest first)
      data.sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated));
      setRequests(data);
    } catch (err) {
      console.log("Error loading requests:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");

    try {
      const user = auth.currentUser;
      if (!user) return;

      const dateStr = new Date().toISOString();

      await addDoc(collection(db, "maintenance_requests"), {
        studentId: user.uid,
        roomId: roomId,
        issueType: category,
        description: issue,
        status: "Pending Review",
        dateCreated: dateStr,
        history: [
          {
            status: "Pending Review",
            timestamp: dateStr,
            note: "Request submitted by student."
          }
        ]
      });

      setMessage("✔ Maintenance request submitted successfully!");
      setIssue("");
      fetchRequests();
    } catch (error) {
      console.log(error);
      setMessage("❌ Failed to submit request: " + error.message);
    }
    setSubmitting(false);
  };

  const handleFeedbackSubmit = async (requestId) => {
    setFeedbackSubmitting(true);
    try {
      const reqRef = doc(db, "maintenance_requests", requestId);
      const reqSnap = await getDoc(reqRef);
      if (!reqSnap.exists()) return;

      const dateStr = new Date().toISOString();
      const currentHistory = reqSnap.data().history || [];

      if (feedbackAction === "resolve") {
        const updatedHistory = [
          ...currentHistory,
          {
            status: "Closed",
            timestamp: dateStr,
            note: `Resolved by student. Rating: ${rating}/5. Review: "${feedbackComments || 'No comment'}"`
          }
        ];
        await updateDoc(reqRef, {
          status: "Closed",
          rating: Number(rating),
          feedbackComments,
          dateClosed: dateStr,
          history: updatedHistory
        });
        alert("Thank you for your feedback! The request is now closed.");
      } else if (feedbackAction === "reopen") {
        const updatedHistory = [
          ...currentHistory,
          {
            status: "In Progress",
            timestamp: dateStr,
            note: `Reopened by student. Reopen notes: "${reopenNotes}"`
          }
        ];
        await updateDoc(reqRef, {
          status: "In Progress", // Sends back to In Progress
          reopenReason: reopenNotes,
          history: updatedHistory
        });
        alert("Request has been reopened. The maintenance team has been notified.");
      }

      // Reset feedback controls
      setSelectedRequestId(null);
      setFeedbackAction(null);
      setFeedbackComments("");
      setReopenNotes("");
      setRating(5);

      fetchRequests();
    } catch (err) {
      console.log(err);
      alert("Failed to submit feedback.");
    }
    setFeedbackSubmitting(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending Review": return { bg: "rgba(245,158,11,0.12)", text: "#FBBF24" };
      case "In Progress": return { bg: "rgba(56,189,248,0.12)", text: "#38BDF8" };
      case "Feedback Required": return { bg: "rgba(139,92,246,0.12)", text: "#A78BFA" };
      case "Closed": return { bg: "rgba(16,185,129,0.12)", text: "#34D399" };
      default: return { bg: "rgba(148,163,184,0.12)", text: "#94A3B8" };
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading maintenance console...</div>;
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
        .req-card {
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        .req-card:hover {
          transform: translateY(-3px);
          border-color: rgba(255,255,255,0.08) !important;
          background: rgba(30, 41, 59, 0.6) !important;
        }
        .feedback-btn-yes {
          background: #10B981 !important;
          color: #0F172A !important;
          font-weight: 700;
          cursor: pointer;
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 13px;
          transition: all 0.2s ease;
        }
        .feedback-btn-yes:hover {
          filter: brightness(1.1);
        }
        .feedback-btn-no {
          background: rgba(239, 68, 68, 0.15) !important;
          border: 1px solid rgba(239, 68, 68, 0.3) !important;
          color: #F87171 !important;
          font-weight: 700;
          cursor: pointer;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 13px;
          transition: all 0.2s ease;
        }
        .feedback-btn-no:hover {
          background: rgba(239, 68, 68, 0.25) !important;
        }
        .star-select {
          font-size: 22px;
          color: #64748B;
          cursor: pointer;
          transition: color 0.1s ease;
        }
        .star-active {
          color: #FBBF24 !important;
        }
      `}</style>

      {/* TITLE */}
      <h1 style={styles.title}>Maintenance Center</h1>
      <p style={styles.subtitle}>
        Report hostel repair issues and track their progress through the verification lifecycle
      </p>

      <div style={styles.splitLayout}>
        {/* NEW REQUEST FORM */}
        <div style={styles.card}>
          <h3 style={{ margin: "0 0 15px 0", fontFamily: "'Outfit', sans-serif", color: "#38BDF8" }}>
            Submit Maintenance Request
          </h3>

          <form onSubmit={handleSubmit} style={styles.form}>
            <label style={styles.label}>Room Number</label>
            <input
              type="text"
              placeholder="e.g. A101"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="form-input"
              style={styles.input}
              required
            />

            <label style={styles.label}>Issue Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="form-input"
              style={styles.input}
              required
            >
              <option value="Plumbing">Plumbing (Faucet, Toilet, Shower)</option>
              <option value="Electrical">Electrical (Lights, Sockets, Fan)</option>
              <option value="Furniture">Furniture (Bed frame, Wardrobe, Chair)</option>
              <option value="Structural">Structural (Door, Window, Wall)</option>
              <option value="Other">Other Issues</option>
            </select>

            <label style={styles.label}>Description of Issue</label>
            <textarea
              placeholder="Provide clear details of what needs to be repaired..."
              value={issue}
              onChange={(e) => setIssue(e.target.value)}
              className="form-input"
              style={styles.textarea}
              required
            />

            {message && (
              <p style={{
                ...styles.message,
                color: message.startsWith("✔") ? "#34D399" : "#EF4444",
                background: message.startsWith("✔") ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
                borderColor: message.startsWith("✔") ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"
              }}>{message}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="action-btn"
              style={styles.button}
            >
              {submitting ? "Submitting Request..." : "File Request 🔧"}
            </button>
          </form>
        </div>

        {/* REQUEST TRACKING LIST */}
        <div style={styles.listSection}>
          <h3 style={{ margin: "0 0 15px 0", fontFamily: "'Outfit', sans-serif", color: "#38BDF8" }}>
            Your Maintenance Logs
          </h3>

          {requests.length === 0 ? (
            <p style={styles.empty}>No maintenance requests filed yet.</p>
          ) : (
            <div style={styles.logList}>
              {requests.map((r) => {
                const sColor = getStatusColor(r.status);
                return (
                  <div key={r.id} className="req-card" style={styles.reqCard}>
                    <div style={styles.cardHeader}>
                      <span style={styles.categoryBadge}>{r.issueType || "General"}</span>
                      <span style={{
                        ...styles.statusBadge,
                        background: sColor.bg,
                        color: sColor.text,
                        border: `1px solid ${sColor.text}30`
                      }}>
                        {r.status}
                      </span>
                    </div>

                    <p style={styles.desc}>{r.description}</p>
                    <div style={styles.cardMeta}>
                      <span>Room: <strong>{r.roomId}</strong></span>
                      <span>Filed: {new Date(r.dateCreated).toLocaleDateString()}</span>
                    </div>

                    {/* REPAIR EVIDENCE (IF PROVIDED) */}
                    {r.repairNotes && (
                      <div style={styles.evidenceBox}>
                        <h4 style={styles.evidenceTitle}>Team Repair Report:</h4>
                        <p style={{ margin: "4px 0 0 0", color: "#E2E8F0" }}>{r.repairNotes}</p>
                        {r.evidenceUrl && (
                          <div style={{ marginTop: "10px" }}>
                            <span style={{ fontSize: "11px", color: "#64748B", display: "block" }}>Evidence Attachment:</span>
                            <img
                              src={r.evidenceUrl}
                              alt="Repair Evidence"
                              style={styles.evidenceImage}
                              onError={(e) => {
                                // Fallback/hide broken mock links gracefully
                                e.target.style.display = "none";
                              }}
                            />
                            <span style={styles.mockImgLabel}>📷 Photo Reference Linked</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* STUDENT FEEDBACK MODIFIER */}
                    {r.status === "Feedback Required" && selectedRequestId !== r.id && (
                      <div style={styles.actionBox}>
                        <p style={{ margin: "0 0 10px 0", fontSize: "13px", color: "#A78BFA", fontWeight: "600" }}>
                          Please review this repair and verify if the issue was satisfactorily resolved.
                        </p>
                        <div style={{ display: "flex", gap: "10px" }}>
                          <button
                            onClick={() => {
                              setSelectedRequestId(r.id);
                              setFeedbackAction("resolve");
                            }}
                            className="feedback-btn-yes"
                          >
                            Yes, it's fixed!
                          </button>
                          <button
                            onClick={() => {
                              setSelectedRequestId(r.id);
                              setFeedbackAction("reopen");
                            }}
                            className="feedback-btn-no"
                          >
                            No, reopen request
                          </button>
                        </div>
                      </div>
                    )}

                    {/* ACTIVE FEEDBACK FORM VIEW */}
                    {selectedRequestId === r.id && (
                      <div style={styles.feedbackForm}>
                        {feedbackAction === "resolve" ? (
                          <>
                            <h4 style={{ margin: "0 0 8px 0", color: "#10B981", fontSize: "14px" }}>
                              Rate the Repair Resolution:
                            </h4>
                            <div style={{ display: "flex", gap: "5px", marginBottom: "12px" }}>
                              {[1, 2, 3, 4, 5].map((star) => (
                                <span
                                  key={star}
                                  onClick={() => setRating(star)}
                                  className={`star-select ${rating >= star ? "star-active" : ""}`}
                                >
                                  ★
                                </span>
                              ))}
                            </div>
                            <textarea
                              placeholder="Leave an optional resolution comment..."
                              value={feedbackComments}
                              onChange={(e) => setFeedbackComments(e.target.value)}
                              className="form-input"
                              style={styles.feedbackText}
                            />
                          </>
                        ) : (
                          <>
                            <h4 style={{ margin: "0 0 8px 0", color: "#F87171", fontSize: "14px" }}>
                              Describe What is Unresolved:
                            </h4>
                            <textarea
                              placeholder="Specify what requires further attention..."
                              value={reopenNotes}
                              onChange={(e) => setReopenNotes(e.target.value)}
                              className="form-input"
                              style={styles.feedbackText}
                              required
                            />
                          </>
                        )}

                        <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                          <button
                            onClick={() => handleFeedbackSubmit(r.id)}
                            disabled={feedbackSubmitting || (feedbackAction === "reopen" && !reopenNotes)}
                            className="feedback-btn-yes"
                          >
                            {feedbackSubmitting ? "Submitting..." : "Submit Review"}
                          </button>
                          <button
                            onClick={() => {
                              setSelectedRequestId(null);
                              setFeedbackAction(null);
                            }}
                            className="feedback-btn-no"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* RATING DISPLAY IF CLOSED */}
                    {r.status === "Closed" && (
                      <div style={styles.closedReview}>
                        <span>Satisfaction Rating:</span>
                        <strong style={{ color: "#FBBF24", marginLeft: "6px" }}>
                          {"★".repeat(r.rating || 5)}{"☆".repeat(5 - (r.rating || 5))}
                        </strong>
                        {r.feedbackComments && (
                          <p style={{ margin: "5px 0 0 0", color: "#64748B", fontStyle: "italic", fontSize: "12.5px" }}>
                            "{r.feedbackComments}"
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Maintenance;

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
  splitLayout: {
    display: "flex",
    gap: "25px",
    flexWrap: "wrap",
  },
  card: {
    backgroundColor: "rgba(30, 41, 59, 0.45)",
    padding: "30px 20px",
    borderRadius: "16px",
    border: "1px solid rgba(255, 255, 255, 0.04)",
    flex: "1 1 350px",
    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
    boxSizing: "border-box",
    height: "fit-content",
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
  textarea: {
    padding: "13px 16px",
    borderRadius: "12px",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    backgroundColor: "rgba(10, 15, 30, 0.6)",
    color: "#F8FAFC",
    outline: "none",
    fontSize: "14px",
    minHeight: "100px",
    resize: "vertical",
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
    width: "100%",
  },
  message: {
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid",
    fontSize: "13.5px",
    lineHeight: "1.4",
  },
  listSection: {
    flex: "1 1 450px",
    boxSizing: "border-box",
  },
  empty: {
    color: "#64748B",
    textAlign: "center",
    padding: "30px",
    fontStyle: "italic",
    border: "1px dashed rgba(255,255,255,0.06)",
    borderRadius: "16px",
  },
  logList: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },
  reqCard: {
    background: "rgba(30, 41, 59, 0.4)",
    border: "1px solid rgba(255,255,255,0.04)",
    padding: "20px",
    borderRadius: "16px",
    boxShadow: "0 8px 20px rgba(0, 0, 0, 0.1)",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },
  categoryBadge: {
    background: "rgba(56, 189, 248, 0.1)",
    border: "1px solid rgba(56, 189, 248, 0.15)",
    color: "#38BDF8",
    padding: "5px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "700",
  },
  statusBadge: {
    padding: "5px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "700",
  },
  desc: {
    margin: "0 0 14px 0",
    fontSize: "14px",
    color: "#F8FAFC",
    lineHeight: "1.5",
  },
  cardMeta: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "12.5px",
    color: "#64748B",
    borderBottom: "1px solid rgba(255,255,255,0.03)",
    paddingBottom: "10px",
  },
  evidenceBox: {
    background: "rgba(10, 15, 30, 0.4)",
    borderLeft: "3px solid #A78BFA",
    padding: "12px",
    borderRadius: "0 8px 8px 0",
    marginTop: "12px",
  },
  evidenceTitle: {
    margin: 0,
    fontSize: "12.5px",
    color: "#A78BFA",
    fontWeight: "700",
  },
  evidenceImage: {
    maxWidth: "100%",
    maxHeight: "160px",
    borderRadius: "8px",
    marginTop: "6px",
    border: "1px solid rgba(255,255,255,0.1)",
  },
  mockImgLabel: {
    fontSize: "11px",
    color: "#A78BFA",
    marginTop: "2px",
    display: "inline-block",
  },
  actionBox: {
    background: "rgba(139,92,246,0.08)",
    border: "1px dashed rgba(139,92,246,0.25)",
    padding: "14px",
    borderRadius: "10px",
    marginTop: "12px",
  },
  feedbackForm: {
    background: "rgba(30, 41, 59, 0.65)",
    border: "1px solid rgba(255,255,255,0.06)",
    padding: "14px",
    borderRadius: "10px",
    marginTop: "12px",
  },
  feedbackText: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "8px",
    fontSize: "13px",
    minHeight: "70px",
    backgroundColor: "rgba(10, 15, 30, 0.5)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "#F8FAFC",
  },
  closedReview: {
    background: "rgba(16,185,129,0.04)",
    borderLeft: "3px solid #10B981",
    padding: "10px 14px",
    borderRadius: "0 8px 8px 0",
    marginTop: "12px",
    fontSize: "13px",
  },
  loading: {
    color: "#E2E8F0",
    textAlign: "center",
    padding: "60px",
    fontSize: "16px",
  },
};