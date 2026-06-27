import { useEffect, useState } from "react";
import { db } from "../../config/firebase";
import {
  collection,
  getDocs,
  doc,
  updateDoc
} from "firebase/firestore";

function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = async () => {
    setLoading(true);

    try {
      // Fetch users to build a map of student details
      const usersSnap = await getDocs(collection(db, "users"));
      const usersMap = {};
      usersSnap.docs.forEach(uDoc => {
        usersMap[uDoc.id] = uDoc.data();
      });

      // Fetch payments
      const snap = await getDocs(collection(db, "payments"));
      const data = snap.docs.map(pDoc => {
        const pData = pDoc.data();
        const student = usersMap[pData.studentId] || {};
        return {
          id: pDoc.id,
          ...pData,
          fullName: student.fullName || "Unknown Student",
          matricNo: student.matricNo || "N/A"
        };
      });

      // Sort payments by date (newest first)
      data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setPayments(data);
    } catch (err) {
      console.log(err);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      const payment = payments.find(p => p.id === id);
      if (!payment) return;

      // Update payment doc
      await updateDoc(doc(db, "payments", id), {
        status
      });

      // Update user doc paymentStatus
      if (payment.studentId) {
        await updateDoc(doc(db, "users", payment.studentId), {
          paymentStatus: status === "Approved" ? "verified" : "rejected"
        });
      }

      alert(`Payment status updated to ${status} ✔`);
      fetchPayments();
    } catch (err) {
      console.log(err);
      alert("Failed to update status");
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading payments...</div>;
  }

  return (
    <div style={styles.container}>
      <style>{`
        .table-row {
          transition: background-color 0.2s ease !important;
        }
        .table-row:hover {
          background-color: rgba(255, 255, 255, 0.02) !important;
        }
        .approve-btn {
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        .approve-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 15px rgba(34, 197, 94, 0.3) !important;
          filter: brightness(1.08);
        }
        .approve-btn:active {
          transform: translateY(1px);
        }
        .reject-btn {
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        .reject-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 15px rgba(239, 68, 68, 0.25) !important;
          filter: brightness(1.08);
        }
        .reject-btn:active {
          transform: translateY(1px);
        }
      `}</style>

      <h2 style={styles.title}>Payment Management</h2>
      <p style={styles.subtitle}>
        Approve or reject student payments to verify their eligibility for room allocation
      </p>

      <div style={styles.tableCard}>
        {payments.length === 0 ? (
          <p style={styles.empty}>No payment records found.</p>
        ) : (
          <div className="table-wrapper" style={{ marginTop: 0 }}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.trHead}>
                  <th style={styles.th}>Student Name</th>
                  <th style={styles.th}>Matric Number</th>
                  <th style={styles.th}>Amount Paid</th>
                  <th style={styles.th}>Reference</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {payments.map(p => (
                  <tr key={p.id} className="table-row" style={styles.tr}>
                    <td style={styles.td}>{p.fullName}</td>
                    <td style={styles.td}>{p.matricNo}</td>
                    <td style={styles.td}>₦{Number(p.amount)?.toLocaleString()}</td>
                    <td style={{ ...styles.td, ...styles.ref }}>{p.reference}</td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.badge,
                        background:
                          p.status === "Approved"
                            ? "rgba(34, 197, 94, 0.15)"
                            : p.status === "Rejected"
                            ? "rgba(239, 68, 68, 0.15)"
                            : "rgba(245, 158, 11, 0.15)",
                        color:
                          p.status === "Approved"
                            ? "#4ADE80"
                            : p.status === "Rejected"
                            ? "#F87171"
                            : "#FBBF24",
                        border:
                          p.status === "Approved"
                            ? "1px solid rgba(34, 197, 94, 0.2)"
                            : p.status === "Rejected"
                            ? "1px solid rgba(239, 68, 68, 0.2)"
                            : "1px solid rgba(245, 158, 11, 0.2)"
                      }}>
                        {p.status || "Pending"}
                      </span>
                    </td>

                    <td style={{ ...styles.td, ...styles.actions }}>
                      {p.status === "pending" && (
                        <>
                          <button
                            onClick={() => updateStatus(p.id, "Approved")}
                            className="approve-btn"
                            style={styles.approve}
                          >
                            Approve
                          </button>

                          <button
                            onClick={() => updateStatus(p.id, "Rejected")}
                            className="reject-btn"
                            style={styles.reject}
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {p.status !== "pending" && (
                        <span style={styles.completedText}>Reviewed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPayments;

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

  tableCard: {
    background: "rgba(20, 26, 46, 0.4)",
    padding: "25px 20px",
    borderRadius: "20px",
    border: "1px solid rgba(255, 255, 255, 0.04)",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "14px",
    textAlign: "left",
  },

  trHead: {
    borderBottom: "2px solid rgba(255, 255, 255, 0.08)",
  },

  tr: {
    borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
  },

  th: {
    padding: "12px 16px",
    color: "#94A3B8",
    fontWeight: "600",
    fontSize: "13px",
  },

  td: {
    padding: "16px",
    color: "#E2E8F0",
    whiteSpace: "nowrap",
  },

  ref: {
    fontFamily: "monospace",
    color: "#38BDF8",
    fontSize: "13px",
  },

  badge: {
    padding: "5px 12px",
    borderRadius: "20px",
    fontSize: "11.5px",
    fontWeight: "700",
    display: "inline-block",
    whiteSpace: "nowrap",
  },

  actions: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
  },

  approve: {
    background: "#22C55E",
    border: "none",
    padding: "6px 14px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "700",
    color: "#0F172A",
    fontSize: "12.5px",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },

  reject: {
    background: "#EF4444",
    border: "none",
    padding: "6px 14px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "700",
    color: "#FFFFFF",
    fontSize: "12.5px",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },

  completedText: {
    color: "#64748B",
    fontSize: "12.5px",
    fontStyle: "italic",
  },

  empty: {
    color: "#64748B",
    textAlign: "center",
    padding: "30px",
    fontStyle: "italic",
  },

  loading: {
    color: "#E2E8F0",
    textAlign: "center",
    padding: "50px",
    fontSize: "16px",
  },
};