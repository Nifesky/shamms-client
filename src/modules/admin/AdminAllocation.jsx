import { useEffect, useState } from "react";
import { db } from "../../config/firebase";
import {
  collection,
  getDocs,
} from "firebase/firestore";

import { allocateRooms } from "../../utils/allocateRoom";

function AdminAllocation() {
  const [students, setStudents] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allocating, setAllocating] = useState(false);
  const [message, setMessage] = useState("");

  const fetchData = async () => {
    setLoading(true);

    try {
      // STUDENTS
      const usersSnap = await getDocs(collection(db, "users"));

      const studentList = usersSnap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(u =>
          u.role === "student"
        );

      setStudents(studentList);

      // ROOMS
      const roomsSnap = await getDocs(collection(db, "rooms"));

      const roomList = roomsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setRooms(roomList);

    } catch (err) {
      console.log(err);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const runAllocation = async () => {
    const confirmRun = window.confirm(
      "Are you sure you want to run the Smart Allocation Engine?\n\n" +
      "This process will group all verified students by department and assign them to matching gender hostel rooms."
    );

    if (!confirmRun) return;

    setAllocating(true);
    setMessage("");

    try {
      const sessionId = await allocateRooms();

      setMessage(`✔ Allocation completed successfully (Session: ${sessionId.slice(0, 8)}...)`);

      // refresh data
      await fetchData();

    } catch (err) {
      console.log(err);
      setMessage(`❌ Allocation failed: ${err.message}`);
    }

    setAllocating(false);
  };

  const unassignedStudents = students.filter(
    s => !s.roomAssigned
  );

  const verifiedUnassigned = unassignedStudents.filter(
    s => s.paymentStatus === "verified"
  );

  const totalCapacity = rooms.reduce(
    (sum, r) => sum + (r.capacity || 0),
    0
  );

  const occupied = rooms.reduce(
    (sum, r) => sum + (r.occupants?.length || 0),
    0
  );

  if (loading) {
    return (
      <div style={styles.loading}>
        Loading allocation system...
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <style>{`
        .action-btn {
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        .action-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 22px rgba(56, 189, 248, 0.3) !important;
          filter: brightness(1.08);
        }
        .action-btn:active:not(:disabled) {
          transform: translateY(1px);
        }
        .stat-card {
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        .stat-card:hover {
          transform: translateY(-4px);
          border-color: rgba(255, 255, 255, 0.1) !important;
          background: rgba(30, 41, 59, 0.6) !important;
          box-shadow: 0 12px 25px rgba(0, 0, 0, 0.25) !important;
        }
        .table-row {
          transition: background-color 0.2s ease !important;
        }
        .table-row:hover {
          background-color: rgba(255, 255, 255, 0.02) !important;
        }
        @media (max-width: 768px) {
          .allocation-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 15px !important;
          }
          .allocation-header button {
            width: 100% !important;
          }
        }
      `}</style>

      {/* HEADER */}
      <div className="allocation-header" style={styles.header}>
        <div>
          <h1 style={styles.title}>
            Smart Room Allocation
          </h1>

          <p style={styles.subtitle}>
            Automatically assign students to rooms based on gender, department, and availability
          </p>
        </div>

        <button
          onClick={runAllocation}
          disabled={allocating || verifiedUnassigned.length === 0}
          className="action-btn"
          style={{
            ...styles.button,
            opacity: (allocating || verifiedUnassigned.length === 0) ? 0.5 : 1,
            cursor: (allocating || verifiedUnassigned.length === 0) ? "not-allowed" : "pointer"
          }}
        >
          {allocating
            ? "Allocating..."
            : "Run Allocation Engine ⚡"}
        </button>
      </div>

      {message && (
        <p style={{
          ...styles.message,
          color: message.startsWith("✔") ? "#22C55E" : "#EF4444"
        }}>
          {message}
        </p>
      )}

      {/* GENDER & PAYMENT WARNING NOTICE */}
      <div style={styles.warningCard}>
        <div style={{ fontSize: "24px" }}>⚠️</div>
        <div>
          <h4 style={{ margin: 0, color: "#FBBF24", fontFamily: "'Outfit', sans-serif" }}>Smart Allocation Policies & Gender Notice</h4>
          <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#94A3B8", lineHeight: "1.5" }}>
            The smart allocation engine enforces two critical policies: (1) <strong>Gender Separation</strong> - Students are only allocated to rooms within hostels matching their registered gender. (2) <strong>Payment verification required</strong> - Students without reviewed/approved payments will not be allocated. Ensure all student payments are approved in the Payments dashboard before running allocation.
          </p>
        </div>
      </div>

      {/* STATS */}
      <div className="responsive-grid-4" style={styles.grid}>

        <div className="stat-card" style={styles.card}>
          <h3 style={styles.cardLabel}>Ready for Allocation (Paid)</h3>
          <p style={{ ...styles.cardVal, color: "#22C55E" }}>{verifiedUnassigned.length}</p>
        </div>

        <div className="stat-card" style={styles.card}>
          <h3 style={styles.cardLabel}>Unassigned Students (Total)</h3>
          <p style={styles.cardVal}>{unassignedStudents.length}</p>
        </div>

        <div className="stat-card" style={styles.card}>
          <h3 style={styles.cardLabel}>Total Bed Capacity</h3>
          <p style={styles.cardVal}>{totalCapacity}</p>
        </div>

        <div className="stat-card" style={styles.card}>
          <h3 style={styles.cardLabel}>Occupied Bed Spaces</h3>
          <p style={styles.cardVal}>{occupied}/{totalCapacity}</p>
        </div>

      </div>

      {/* STUDENT LIST */}
      <div style={styles.tableCard}>
        <h3 style={{ color: "#38BDF8", marginBottom: "5px", fontSize: "18px", fontFamily: "'Outfit', sans-serif" }}>Unassigned Students Queue</h3>

        {unassignedStudents.length === 0 ? (
          <p style={styles.empty}>All registered students have been assigned rooms.</p>
        ) : (
          <div className="table-wrapper">
            <table style={styles.table}>
              <thead>
                <tr style={styles.trHead}>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Gender</th>
                  <th style={styles.th}>Department</th>
                  <th style={styles.th}>Level</th>
                  <th style={styles.th}>Matric No</th>
                  <th style={styles.th}>Payment Status</th>
                </tr>
              </thead>

              <tbody>
                {unassignedStudents.map(s => (
                  <tr key={s.id} className="table-row" style={styles.tr}>
                    <td style={styles.td}>{s.fullName}</td>
                    <td style={styles.td}>{s.gender || "N/A"}</td>
                    <td style={styles.td}>{s.courseOfStudy || "General"}</td>
                    <td style={styles.td}>{s.level} Level</td>
                    <td style={styles.td}>{s.matricNo}</td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.badge,
                        background: s.paymentStatus === "verified" ? "rgba(34, 197, 94, 0.15)" : "rgba(245, 158, 11, 0.15)",
                        color: s.paymentStatus === "verified" ? "#4ADE80" : "#FBBF24",
                        border: s.paymentStatus === "verified" ? "1px solid rgba(34, 197, 94, 0.2)" : "1px solid rgba(245, 158, 11, 0.2)"
                      }}>
                        {s.paymentStatus === "verified" ? "Verified" : "Pending Approval"}
                      </span>
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

export default AdminAllocation;

const styles = {
  container: {
    color: "#E2E8F0",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px",
  },

  title: {
    fontSize: "28px",
    color: "#38BDF8",
    margin: 0,
    fontFamily: "'Outfit', sans-serif",
  },

  subtitle: {
    fontSize: "14px",
    color: "#64748B",
    margin: "5px 0 0 0",
  },

  button: {
    padding: "13px 20px",
    background: "linear-gradient(135deg,#38BDF8,#0EA5E9)",
    border: "none",
    borderRadius: "12px",
    color: "#0F172A",
    fontWeight: "700",
    fontSize: "14px",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },

  message: {
    marginBottom: "20px",
    fontSize: "14.5px",
    fontWeight: "700",
  },

  warningCard: {
    display: "flex",
    gap: "15px",
    alignItems: "center",
    background: "rgba(245, 158, 11, 0.08)",
    border: "1px solid rgba(245, 158, 11, 0.2)",
    padding: "18px 24px",
    borderRadius: "16px",
    marginBottom: "30px",
  },

  grid: {
    marginBottom: "30px",
  },

  card: {
    background: "rgba(30, 41, 59, 0.45)",
    padding: "20px",
    borderRadius: "16px",
    border: "1px solid rgba(255, 255, 255, 0.04)",
  },

  cardLabel: {
    margin: 0,
    fontSize: "11.5px",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: "1px",
    fontWeight: "600",
  },

  cardVal: {
    margin: "8px 0 0 0",
    fontSize: "22px",
    fontWeight: "700",
    color: "#F8FAFC",
    fontFamily: "'Outfit', sans-serif",
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

  badge: {
    padding: "5px 12px",
    borderRadius: "20px",
    fontSize: "11.5px",
    fontWeight: "700",
    display: "inline-block",
    whiteSpace: "nowrap",
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
    padding: "60px",
    fontSize: "16px",
  },
};