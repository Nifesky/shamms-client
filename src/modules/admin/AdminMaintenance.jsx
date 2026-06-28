import { useEffect, useState } from "react";
import { db } from "../../config/firebase";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc
} from "firebase/firestore";

function AdminMaintenance() {
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [activeTab, setActiveTab] = useState("All");
  const [loading, setLoading] = useState(true);

  // Evidence Modal states
  const [showModal, setShowModal] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [repairNotes, setRepairNotes] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [modalSubmitting, setModalSubmitting] = useState(false);

  // MOCK EVIDENCE PHOTO PRESETS
  const PRESETS = [
    { name: "Plumbing Faucet Fix", url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80" },
    { name: "Electrical Wiring Fix", url: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=600&q=80" },
    { name: "Carpentry Door/Lock Fix", url: "https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?auto=format&fit=crop&w=600&q=80" },
    { name: "General Handyman Repair", url: "https://images.unsplash.com/photo-1581783898377-1c85bf937427?auto=format&fit=crop&w=600&q=80" }
  ];

  const fetchRequests = async () => {
    setLoading(true);

    try {
      // Resolve student profiles
      const usersSnap = await getDocs(collection(db, "users"));
      const usersMap = {};
      usersSnap.docs.forEach(uDoc => {
        usersMap[uDoc.id] = uDoc.data();
      });

      const snap = await getDocs(
        collection(db, "maintenance_requests")
      );

      const data = snap.docs.map(pDoc => {
        const pData = pDoc.data();
        const student = usersMap[pData.studentId] || {};
        return {
          id: pDoc.id,
          ...pData,
          studentName: student.fullName || "Unknown Student",
          matricNo: student.matricNo || "N/A"
        };
      });

      // Sort newest first
      data.sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated));
      setRequests(data);
      applyFilter(data, activeTab);
    } catch (err) {
      console.log("Error loading requests admin side:", err);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const applyFilter = (dataList, tab) => {
    if (tab === "All") {
      setFilteredRequests(dataList);
    } else if (tab === "Pending") {
      setFilteredRequests(dataList.filter(r => r.status === "Pending Review"));
    } else if (tab === "In Progress") {
      setFilteredRequests(dataList.filter(r => r.status === "In Progress"));
    } else if (tab === "Awaiting Verification") {
      setFilteredRequests(dataList.filter(r => r.status === "Feedback Required"));
    } else if (tab === "Closed") {
      setFilteredRequests(dataList.filter(r => r.status === "Closed"));
    }
  };

  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    applyFilter(requests, tabName);
  };

  const handleStartRepair = async (id) => {
    try {
      const reqRef = doc(db, "maintenance_requests", id);
      const reqSnap = await getDoc(reqRef);
      if (!reqSnap.exists()) return;

      const dateStr = new Date().toISOString();
      const currentHistory = reqSnap.data().history || [];

      await updateDoc(reqRef, {
        status: "In Progress",
        history: [
          ...currentHistory,
          {
            status: "In Progress",
            timestamp: dateStr,
            note: "Repair work started by maintenance crew."
          }
        ]
      });

      alert("Repair status updated to In Progress. ✔");
      fetchRequests();
    } catch (err) {
      console.log(err);
      alert("Failed to start repair.");
    }
  };

  const handleOpenCompleteModal = (id) => {
    setSelectedRequestId(id);
    setRepairNotes("");
    setEvidenceUrl(PRESETS[0].url); // Default to first preset
    setShowModal(true);
  };

  const handleCompleteRepairSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRequestId) return;

    setModalSubmitting(true);
    try {
      const reqRef = doc(db, "maintenance_requests", selectedRequestId);
      const reqSnap = await getDoc(reqRef);
      if (reqSnap.exists()) {
        const dateStr = new Date().toISOString();
        const currentHistory = reqSnap.data().history || [];

        await updateDoc(reqRef, {
          status: "Feedback Required",
          repairNotes,
          evidenceUrl,
          dateCompleted: dateStr,
          history: [
            ...currentHistory,
            {
              status: "Feedback Required",
              timestamp: dateStr,
              note: `Repair marked completed. Notes: "${repairNotes}"`
            }
          ]
        });
      }

      alert("Work logs and evidence submitted. Awaiting student verification feedback. ✔");
      setShowModal(false);
      fetchRequests();
    } catch (err) {
      console.log(err);
      alert("Failed to record completion data.");
    }
    setModalSubmitting(false);
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
    return <div style={styles.loading}>Loading maintenance requests...</div>;
  }

  return (
    <div style={styles.container}>
      <style>{`
        .tab-btn {
          background: transparent;
          border: none;
          color: #94A3B8;
          padding: 8px 16px;
          cursor: pointer;
          font-weight: 600;
          font-size: 13.5px;
          border-bottom: 2px solid transparent;
          transition: all 0.2s ease;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .tab-btn:hover {
          color: #38BDF8;
        }
        .tab-btn-active {
          color: #38BDF8 !important;
          border-bottom-color: #38BDF8 !important;
        }
        .req-card {
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        .req-card:hover {
          transform: translateY(-4px);
          border-color: rgba(255,255,255,0.08) !important;
          box-shadow: 0 10px 25px rgba(0,0,0,0.2) !important;
        }
        .preset-chip {
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(10,15,30,0.5);
          color: #94A3B8;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .preset-chip:hover {
          border-color: #38BDF8;
          color: #38BDF8;
        }
        .preset-chip-active {
          background: rgba(56, 189, 248, 0.1) !important;
          border-color: #38BDF8 !important;
          color: #38BDF8 !important;
        }
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.7);
          backdrop-filter: blur(5px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1100;
          padding: 20px;
        }
        .action-btn {
          transition: all 0.2s ease;
        }
        .action-btn:hover {
          filter: brightness(1.1);
        }
      `}</style>

      {/* HEADER */}
      <h2 style={styles.title}>Maintenance Management</h2>
      <p style={styles.subtitle}>
        Track reports, coordinate repair crews, and document proof of work for verification
      </p>

      {/* TABS FILTER */}
      <div style={styles.tabsContainer}>
        {["All", "Pending", "In Progress", "Awaiting Verification", "Closed"].map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={`tab-btn ${activeTab === tab ? "tab-btn-active" : ""}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* REQUESTS LIST */}
      {filteredRequests.length === 0 ? (
        <p style={styles.empty}>No maintenance requests found in this category.</p>
      ) : (
        <div style={styles.grid}>
          {filteredRequests.map(r => {
            const sColor = getStatusColor(r.status);
            return (
              <div key={r.id} className="req-card" style={styles.card}>
                <div style={styles.cardHeader}>
                  <span style={styles.category}>{r.issueType || "General"}</span>
                  <span style={{
                    ...styles.badge,
                    background: sColor.bg,
                    color: sColor.text,
                    border: `1px solid ${sColor.text}25`
                  }}>
                    {r.status}
                  </span>
                </div>

                <p style={styles.desc}>{r.description}</p>

                <div style={styles.meta}>
                  <p style={styles.metaRow}>Room: <strong>{r.roomId}</strong></p>
                  <p style={styles.metaRow}>Filed by: <strong>{r.studentName}</strong> ({r.matricNo})</p>
                  <p style={styles.metaRow}>Date: {new Date(r.dateCreated).toLocaleDateString()}</p>
                </div>

                {/* TIMELINE PROGRESS HISTORY */}
                {r.history && r.history.length > 0 && (
                  <div style={styles.historyBox}>
                    <span style={{ fontSize: "11px", color: "#64748B", fontWeight: "700" }}>TIMELINE LOGS:</span>
                    <ul style={styles.historyList}>
                      {r.history.map((h, i) => (
                        <li key={i} style={styles.historyItem}>
                          <span style={{ color: "#38BDF8" }}>[{new Date(h.timestamp).toLocaleTimeString()}]</span> {h.note}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* COMPLETED REPORT & EVIDENCE IF RESOLVED */}
                {r.repairNotes && (
                  <div style={styles.repairNotesBox}>
                    <h4 style={{ margin: 0, fontSize: "12.5px", color: "#A78BFA" }}>Admin Work Details:</h4>
                    <p style={{ margin: "4px 0 0 0", color: "#E2E8F0", fontSize: "13px" }}>{r.repairNotes}</p>
                    {r.evidenceUrl && (
                      <div style={{ marginTop: "10px" }}>
                        <span style={{ fontSize: "11px", color: "#64748B", display: "block" }}>Evidence Attachment:</span>
                        <img src={r.evidenceUrl} alt="Repair proof" style={styles.evidenceThumbnail} />
                      </div>
                    )}
                  </div>
                )}

                {/* STUDENT FEEDBACK RATINGS */}
                {r.status === "Closed" && (
                  <div style={styles.feedbackSection}>
                    <h4 style={{ margin: 0, fontSize: "12px", color: "#34D399" }}>Student Verification Rating:</h4>
                    <div style={{ fontSize: "16px", color: "#FBBF24", marginTop: "3px" }}>
                      {"★".repeat(r.rating || 5)}{"☆".repeat(5 - (r.rating || 5))}
                    </div>
                    {r.feedbackComments && (
                      <p style={styles.feedbackText}>"{r.feedbackComments}"</p>
                    )}
                  </div>
                )}

                {/* ACTIONS */}
                <div style={styles.actions}>
                  {r.status === "Pending Review" && (
                    <button
                      onClick={() => handleStartRepair(r.id)}
                      className="action-btn"
                      style={styles.startBtn}
                    >
                      Start Repair Work 🛠
                    </button>
                  )}
                  {r.status === "In Progress" && (
                    <button
                      onClick={() => handleOpenCompleteModal(r.id)}
                      className="action-btn"
                      style={styles.completeBtn}
                    >
                      Log Completion & Evidence 📷
                    </button>
                  )}
                  {r.status === "Feedback Required" && (
                    <span style={styles.statusText}>Awaiting Student Verification</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* EVIDENCE WORK COMPLETION MODAL */}
      {showModal && (
        <div className="modal-overlay">
          <div style={styles.modal}>
            <h3 style={{ margin: "0 0 8px 0", color: "#38BDF8", fontFamily: "'Outfit', sans-serif" }}>
              Complete Repair Documentation
            </h3>
            <p style={{ margin: "0 0 20px 0", color: "#64748B", fontSize: "13.5px" }}>
              Provide description of the repairs done and select proof of work photographs.
            </p>

            <form onSubmit={handleCompleteRepairSubmit} style={styles.modalForm}>
              <label style={styles.label}>Repair Completion Summary</label>
              <textarea
                placeholder="Describe exactly what repairs were carried out..."
                value={repairNotes}
                onChange={(e) => setRepairNotes(e.target.value)}
                className="form-input"
                style={styles.modalTextarea}
                required
              />

              <label style={styles.label}>Evidence Photo Presets</label>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "10px" }}>
                {PRESETS.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => setEvidenceUrl(p.url)}
                    className={`preset-chip ${evidenceUrl === p.url ? "preset-chip-active" : ""}`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>

              <label style={styles.label}>Evidence Image URL (Custom Link)</label>
              <input
                type="text"
                placeholder="Paste evidence image URL..."
                value={evidenceUrl}
                onChange={(e) => setEvidenceUrl(e.target.value)}
                className="form-input"
                style={styles.modalInput}
                required
              />

              {evidenceUrl && (
                <div style={{ marginTop: "12px", border: "1px solid rgba(255,255,255,0.06)", padding: "10px", borderRadius: "10px", textAlign: "center" }}>
                  <span style={{ fontSize: "11px", color: "#64748B", display: "block", marginBottom: "6px" }}>Image Preview:</span>
                  <img src={evidenceUrl} alt="Thumbnail preview" style={{ height: "100px", borderRadius: "6px" }} />
                </div>
              )}

              <div style={styles.modalActions}>
                <button
                  type="submit"
                  disabled={modalSubmitting}
                  className="action-btn"
                  style={styles.modalSubmit}
                >
                  {modalSubmitting ? "Saving Work..." : "Mark Completed & Notify Student 🚀"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={styles.modalCancel}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminMaintenance;

/* ================= STYLES ================= */

const styles = {
  container: {
    color: "#E2E8F0",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  title: {
    fontSize: "26px",
    color: "#38BDF8",
    margin: 0,
    fontFamily: "'Outfit', sans-serif",
  },
  subtitle: {
    fontSize: "14px",
    color: "#64748B",
    margin: "5px 0 25px 0",
  },
  tabsContainer: {
    display: "flex",
    gap: "10px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
    paddingBottom: "4px",
    marginBottom: "25px",
    overflowX: "auto",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
    gap: "20px",
    marginBottom: "30px",
  },
  card: {
    background: "rgba(30, 41, 59, 0.45)",
    padding: "20px",
    borderRadius: "16px",
    border: "1px solid rgba(255, 255, 255, 0.04)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },
  category: {
    background: "rgba(56, 189, 248, 0.1)",
    border: "1px solid rgba(56, 189, 248, 0.15)",
    color: "#38BDF8",
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "11.5px",
    fontWeight: "700",
  },
  badge: {
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "700",
  },
  desc: {
    fontSize: "13.5px",
    color: "#F8FAFC",
    lineHeight: "1.5",
    margin: "0 0 15px 0",
  },
  meta: {
    background: "rgba(10, 15, 30, 0.3)",
    padding: "12px 14px",
    borderRadius: "10px",
    fontSize: "12.5px",
    color: "#94A3B8",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    marginBottom: "12px",
  },
  metaRow: {
    margin: 0,
  },
  historyBox: {
    background: "rgba(10,15,30,0.15)",
    border: "1px solid rgba(255,255,255,0.03)",
    padding: "10px",
    borderRadius: "8px",
    marginBottom: "12px",
  },
  historyList: {
    margin: "6px 0 0 0",
    paddingLeft: "15px",
    fontSize: "11.5px",
    color: "#94A3B8",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  historyItem: {
    lineHeight: "1.4",
  },
  repairNotesBox: {
    background: "rgba(139,92,246,0.05)",
    borderLeft: "3px solid #8B5CF6",
    padding: "10px 12px",
    borderRadius: "0 8px 8px 0",
    marginBottom: "12px",
  },
  evidenceThumbnail: {
    height: "80px",
    borderRadius: "6px",
    marginTop: "6px",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  feedbackSection: {
    background: "rgba(16,185,129,0.04)",
    borderLeft: "3px solid #10B981",
    padding: "10px 12px",
    borderRadius: "0 8px 8px 0",
    marginBottom: "12px",
    fontSize: "12.5px",
  },
  feedbackText: {
    margin: "4px 0 0 0",
    color: "#64748B",
    fontStyle: "italic",
  },
  actions: {
    marginTop: "10px",
  },
  startBtn: {
    width: "100%",
    padding: "10px",
    background: "linear-gradient(135deg, #38BDF8, #0EA5E9)",
    color: "#0F172A",
    border: "none",
    borderRadius: "10px",
    fontWeight: "700",
    fontSize: "13px",
    cursor: "pointer",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  completeBtn: {
    width: "100%",
    padding: "10px",
    background: "linear-gradient(135deg, #A78BFA, #8B5CF6)",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "10px",
    fontWeight: "700",
    fontSize: "13px",
    cursor: "pointer",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  statusText: {
    fontSize: "12.5px",
    color: "#64748B",
    fontStyle: "italic",
    textAlign: "center",
    display: "block",
  },
  empty: {
    color: "#64748B",
    textAlign: "center",
    padding: "40px",
    fontStyle: "italic",
    border: "1px dashed rgba(255,255,255,0.06)",
    borderRadius: "16px",
  },
  loading: {
    color: "#E2E8F0",
    textAlign: "center",
    padding: "60px",
    fontSize: "16px",
  },

  // MODAL STYLES
  modal: {
    background: "#1E293B",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    padding: "30px 24px",
    borderRadius: "20px",
    maxWidth: "500px",
    width: "100%",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
  },
  modalForm: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  label: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#E2E8F0",
  },
  modalTextarea: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "10px",
    backgroundColor: "rgba(10,15,30,0.5)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "#F8FAFC",
    fontSize: "13.5px",
    minHeight: "80px",
    boxSizing: "border-box",
  },
  modalInput: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "10px",
    backgroundColor: "rgba(10,15,30,0.5)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "#F8FAFC",
    fontSize: "13.5px",
    boxSizing: "border-box",
  },
  modalActions: {
    display: "flex",
    gap: "10px",
    marginTop: "15px",
  },
  modalSubmit: {
    flex: 2,
    padding: "12px",
    background: "linear-gradient(135deg, #10B981, #059669)",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "10px",
    fontWeight: "700",
    cursor: "pointer",
    fontSize: "13.5px",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  modalCancel: {
    flex: 1,
    padding: "12px",
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    color: "#94A3B8",
    borderRadius: "10px",
    fontWeight: "600",
    cursor: "pointer",
    fontSize: "13.5px",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  }
};