import { useEffect, useState } from "react";
import { db } from "../../config/firebase";
import {
  collection,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";

function AdminAllocationHistory() {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. LOAD ALL SESSIONS
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const snap = await getDocs(collection(db, "allocation_history"));

        const data = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        // Sort by newest first
        data.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);

        setSessions(data);
      } catch (err) {
        console.log(err);
      }

      setLoading(false);
    };

    fetchSessions();
  }, []);

  // 2. LOAD SESSION LOGS
  const viewSession = async (session) => {
    setSelectedSession(session);
    setLogs([]);

    try {
      const logsSnap = await getDocs(
        collection(db, "allocation_history", session.id, "logs")
      );

      const logsData = await Promise.all(
        logsSnap.docs.map(async (d) => {
          const log = d.data();

          // fetch student
          const studentRef = doc(db, "users", log.studentId);
          const studentSnap = await getDoc(studentRef);

          // fetch room
          const roomRef = doc(db, "rooms", log.roomId);
          const roomSnap = await getDoc(roomRef);

          return {
            id: d.id,
            ...log,
            student: studentSnap.exists() ? studentSnap.data() : null,
            room: roomSnap.exists() ? roomSnap.data() : null,
          };
        })
      );

      setLogs(logsData);
    } catch (err) {
      console.log(err);
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading allocation history...</div>;
  }

  return (
    <div style={styles.container}>
      <style>{`
        .session-card {
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
          border: 1px solid rgba(255, 255, 255, 0.04) !important;
        }
        .session-card:hover {
          transform: translateY(-2px);
          background-color: rgba(30, 41, 59, 0.75) !important;
          border-color: rgba(56, 189, 248, 0.25) !important;
          box-shadow: 0 6px 15px rgba(0, 0, 0, 0.2) !important;
        }
        .session-card-active {
          border-color: #38BDF8 !important;
          background-color: rgba(30, 41, 59, 0.9) !important;
          box-shadow: 0 0 12px rgba(56, 189, 248, 0.15) !important;
        }
        .table-row {
          transition: background-color 0.2s ease !important;
        }
        .table-row:hover {
          background-color: rgba(255, 255, 255, 0.02) !important;
        }

        @media (max-width: 768px) {
          .history-layout {
            flex-direction: column !important;
          }
          .history-sidebar {
            width: 100% !important;
            box-sizing: border-box !important;
          }
        }
      `}</style>

      <h1 style={styles.title}>Allocation History</h1>
      <p style={styles.subtitle}>
        View details and logs of past smart room allocation sessions
      </p>

      <div className="history-layout" style={styles.layout}>
        {/* LEFT PANEL */}
        <div className="history-sidebar" style={styles.sidebar}>
          <h3 style={styles.sectionTitle}>Sessions</h3>

          {sessions.length === 0 ? (
            <p style={styles.empty}>No allocation history yet</p>
          ) : (
            sessions.map((s) => (
              <div
                key={s.id}
                onClick={() => viewSession(s)}
                className={selectedSession?.id === s.id ? "session-card session-card-active" : "session-card"}
                style={styles.sessionCard}
              >
                <p style={styles.sessionId}>
                  Session: {s.id.slice(0, 8)}...
                </p>
                <p style={styles.sessionMeta}>
                  Allocated: {s.totalStudents || 0} Students
                </p>
                <p style={styles.sessionTime}>
                  {s.createdAt ? new Date(s.createdAt.seconds * 1000).toLocaleString() : "Date N/A"}
                </p>
              </div>
            ))
          )}
        </div>

        {/* RIGHT PANEL */}
        <div style={styles.main}>
          {!selectedSession ? (
            <p style={styles.placeholder}>
              Select an allocation session from the left panel to view detailed logs
            </p>
          ) : (
            <>
              <h3 style={styles.sectionTitle}>
                Session Details ({selectedSession.id.slice(0, 8)}...)
              </h3>

              {logs.length === 0 ? (
                <p style={styles.empty}>Loading logs or no logs found in this session...</p>
              ) : (
                <div className="table-wrapper" style={{ marginTop: 0 }}>
                  <table style={styles.table}>
                    <thead>
                      <tr style={styles.trHead}>
                        <th style={styles.th}>Student Name</th>
                        <th style={styles.th}>Department</th>
                        <th style={styles.th}>Level</th>
                        <th style={styles.th}>Room Number</th>
                        <th style={styles.th}>Capacity</th>
                      </tr>
                    </thead>

                    <tbody>
                      {logs.map((l) => (
                        <tr key={l.id} className="table-row" style={styles.tr}>
                          <td style={styles.td}>
                            {l.student?.fullName || "Unknown Student"}
                          </td>
                          <td style={styles.td}>{l.courseOfStudy || l.student?.courseOfStudy || "General"}</td>
                          <td style={styles.td}>{l.level} Level</td>
                          <td style={{ ...styles.td, ...styles.roomNo }}>{l.room?.roomNumber || l.roomId}</td>
                          <td style={styles.td}>{l.room?.capacity ? `${l.room.capacity}-Man` : "N/A"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminAllocationHistory;

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

  layout: {
    display: "flex",
    gap: "20px",
  },

  sidebar: {
    width: "280px",
    background: "rgba(30, 41, 59, 0.45)",
    padding: "20px 15px",
    borderRadius: "16px",
    height: "fit-content",
    border: "1px solid rgba(255, 255, 255, 0.04)",
  },

  main: {
    flex: 1,
    background: "rgba(20, 26, 46, 0.4)",
    padding: "25px",
    borderRadius: "20px",
    border: "1px solid rgba(255, 255, 255, 0.04)",
  },

  sessionCard: {
    padding: "14px",
    background: "rgba(15, 23, 42, 0.5)",
    marginBottom: "12px",
    borderRadius: "10px",
    cursor: "pointer",
  },

  sessionId: {
    margin: 0,
    fontSize: "13.5px",
    fontWeight: "bold",
    color: "#F8FAFC",
  },

  sessionMeta: {
    margin: "6px 0 0 0",
    fontSize: "12.5px",
    color: "#38BDF8",
    fontWeight: "600",
  },

  sessionTime: {
    margin: "4px 0 0 0",
    fontSize: "11px",
    color: "#64748B",
  },

  sectionTitle: {
    margin: "0 0 15px 0",
    color: "#38BDF8",
    fontSize: "18px",
    fontWeight: "700",
    fontFamily: "'Outfit', sans-serif",
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
    whiteSpace: "nowrap",
  },

  roomNo: {
    fontWeight: "bold",
    color: "#F4B400",
  },

  placeholder: {
    color: "#64748B",
    textAlign: "center",
    padding: "60px",
    fontStyle: "italic",
  },

  empty: {
    fontSize: "13px",
    color: "#64748B",
    padding: "10px",
  },

  loading: {
    color: "#E2E8F0",
    padding: "50px",
    textAlign: "center",
    fontSize: "16px",
  },
};
