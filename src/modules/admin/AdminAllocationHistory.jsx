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
      <h1 style={styles.title}>Allocation History</h1>
      <p style={styles.subtitle}>
        View all past room allocation sessions
      </p>

      <div style={styles.layout}>
        {/* LEFT PANEL */}
        <div style={styles.sidebar}>
          <h3 style={styles.sectionTitle}>Sessions</h3>

          {sessions.length === 0 ? (
            <p style={styles.empty}>No allocation history yet</p>
          ) : (
            sessions.map((s) => (
              <div
                key={s.id}
                onClick={() => viewSession(s)}
                style={styles.sessionCard}
              >
                <p style={styles.sessionId}>
                  Session: {s.id.slice(0, 6)}...
                </p>
                <p style={styles.sessionMeta}>
                  Students: {s.totalStudents || 0}
                </p>
              </div>
            ))
          )}
        </div>

        {/* RIGHT PANEL */}
        <div style={styles.main}>
          {!selectedSession ? (
            <p style={styles.placeholder}>
              Select a session to view details
            </p>
          ) : (
            <>
              <h3 style={styles.sectionTitle}>
                Session Details
              </h3>

              <table style={styles.table}>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Level</th>
                    <th>Room</th>
                    <th>Capacity</th>
                  </tr>
                </thead>

                <tbody>
                  {logs.map((l) => (
                    <tr key={l.id}>
                      <td>
                        {l.student?.fullName || "Unknown"}
                      </td>
                      <td>{l.level}</td>
                      <td>{l.room?.name || l.roomId}</td>
                      <td>{l.room?.capacity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
  },

  title: {
    fontSize: "26px",
    color: "#38BDF8",
  },

  subtitle: {
    fontSize: "13px",
    color: "#94A3B8",
    marginBottom: "20px",
  },

  layout: {
    display: "flex",
    gap: "20px",
  },

  sidebar: {
    width: "280px",
    background: "#1E293B",
    padding: "15px",
    borderRadius: "12px",
  },

  main: {
    flex: 1,
    background: "rgba(17,24,39,0.6)",
    padding: "15px",
    borderRadius: "12px",
  },

  sessionCard: {
    padding: "10px",
    background: "#0F172A",
    marginBottom: "10px",
    borderRadius: "8px",
    cursor: "pointer",
  },

  sessionId: {
    fontSize: "13px",
    fontWeight: "bold",
  },

  sessionMeta: {
    fontSize: "12px",
    color: "#94A3B8",
  },

  sectionTitle: {
    marginBottom: "10px",
    color: "#38BDF8",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "14px",
  },

  placeholder: {
    color: "#94A3B8",
  },

  empty: {
    fontSize: "13px",
    color: "#94A3B8",
  },

  loading: {
    color: "#E2E8F0",
    padding: "30px",
  },
};
