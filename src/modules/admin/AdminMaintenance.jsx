import { useEffect, useState } from "react";
import { db } from "../../config/firebase";
import {
  collection,
  getDocs,
  doc,
  updateDoc
} from "firebase/firestore";

function AdminMaintenance() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    setLoading(true);

    try {
      const snap = await getDocs(
        collection(db, "maintenance_requests")
      );

      const data = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setRequests(data);
    } catch (err) {
      console.log(err);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await updateDoc(
        doc(db, "maintenance_requests", id),
        { status }
      );

      fetchRequests();
    } catch (err) {
      console.log(err);
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading requests...</div>;
  }

  return (
    <div style={styles.container}>

      <h2 style={styles.title}>
        Maintenance Management
      </h2>

      <p style={styles.subtitle}>
        Track and resolve hostel issues
      </p>

      <div style={styles.grid}>

        {requests.map(r => (
          <div key={r.id} style={styles.card}>

            <h3>{r.issueType}</h3>

            <p style={styles.text}>
              Room: {r.roomId}
            </p>

            <p style={styles.text}>
              {r.description}
            </p>

            <span style={{
              ...styles.badge,
              background:
                r.status === "Resolved"
                  ? "#22C55E"
                  : r.status === "In Progress"
                  ? "#38BDF8"
                  : "#F59E0B"
            }}>
              {r.status || "Pending"}
            </span>

            <div style={styles.actions}>
              <button
                onClick={() =>
                  updateStatus(r.id, "In Progress")
                }
                style={styles.btn}
              >
                Start
              </button>

              <button
                onClick={() =>
                  updateStatus(r.id, "Resolved")
                }
                style={styles.resolve}
              >
                Resolve
              </button>
            </div>

          </div>
        ))}

      </div>

    </div>
  );
}

export default AdminMaintenance;

const styles = {
  container: {
    color: "#E2E8F0",
  },

  title: {
    fontSize: "24px",
    color: "#38BDF8",
  },

  subtitle: {
    fontSize: "12px",
    color: "#94A3B8",
    marginBottom: "20px",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "15px",
  },

  card: {
    background: "#1E293B",
    padding: "15px",
    borderRadius: "12px",
  },

  text: {
    fontSize: "13px",
    color: "#CBD5E1",
  },

  badge: {
    display: "inline-block",
    padding: "5px 10px",
    borderRadius: "20px",
    color: "#0F172A",
    fontSize: "12px",
    marginTop: "10px",
  },

  actions: {
    display: "flex",
    gap: "10px",
    marginTop: "10px",
  },

  btn: {
    background: "#38BDF8",
    border: "none",
    padding: "6px 10px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
  },

  resolve: {
    background: "#22C55E",
    border: "none",
    padding: "6px 10px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
  },

  loading: {
    color: "#E2E8F0",
    textAlign: "center",
    padding: "40px",
  },
};