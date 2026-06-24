import { useEffect, useState } from "react";
import { db } from "../../config/firebase";
import { collection, getDocs } from "firebase/firestore";
import { runAllocationEngine } from "../../utils/allocationEngine";

function AdminDashboard() {
  const [students, setStudents] = useState([]);
  const [payments, setPayments] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userSnap = await getDocs(collection(db, "users"));
        const allUsers = userSnap.docs.map((d) => d.data());

        const studentList = allUsers.filter((u) => u.role === "student");
        setStudents(studentList);

        const paySnap = await getDocs(collection(db, "payments"));
        setPayments(paySnap.docs.map((d) => d.data()));

        const maintSnap = await getDocs(
          collection(db, "maintenance_requests")
        );
        setMaintenance(maintSnap.docs.map((d) => d.data()));
      } catch (err) {
        console.log(err.message);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  const verifiedPayments = payments.filter(
    (p) => p.status === "verified"
  );

  const pendingPayments = payments.filter(
    (p) => p.status !== "verified"
  );

  if (loading) {
    return <div style={styles.loading}>Loading Admin Dashboard...</div>;
  }

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Admin Dashboard</h1>
          <p style={styles.subtitle}>
            Smart Hostel Allocation Control Center
          </p>
        </div>

        <button onClick={runAllocationEngine} style={styles.actionBtn}>
          Run Allocation Engine 🚀
        </button>
      </div>

      {/* CARDS */}
      <div style={styles.grid}>
        <div style={styles.card}>
          <h3>Total Students</h3>
          <p>{students.length}</p>
        </div>

        <div style={styles.card}>
          <h3>Verified Payments</h3>
          <p>{verifiedPayments.length}</p>
        </div>

        <div style={styles.card}>
          <h3>Pending Payments</h3>
          <p>{pendingPayments.length}</p>
        </div>

        <div style={styles.card}>
          <h3>Maintenance Requests</h3>
          <p>{maintenance.length}</p>
        </div>
      </div>

      {/* INSIGHTS SECTION */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>System Insights</h2>

        <div style={styles.insightBox}>
          <p>
            🏠 Allocation Status:{" "}
            <b>
              {students.filter((s) => s.roomAssigned).length} /{" "}
              {students.length}
            </b>{" "}
            assigned
          </p>

          <p>
            💳 Payment Completion:{" "}
            <b>
              {Math.round(
                (verifiedPayments.length / (payments.length || 1)) *
                  100
              )}
              %
            </b>
          </p>

          <p>
            ⚠ Pending Maintenance:{" "}
            <b>{maintenance.length}</b>
          </p>
        </div>
      </div>

      {/* RECENT ACTIVITY */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Recent Activity</h2>

        <div style={styles.activityBox}>
          {maintenance.slice(0, 3).map((m, i) => (
            <div key={i} style={styles.activityItem}>
              🛠 {m.issueDescription || "Maintenance request"}
            </div>
          ))}

          {payments.slice(0, 3).map((p, i) => (
            <div key={i} style={styles.activityItem}>
              💳 Payment: {p.status}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
const styles = {
  container: {
    padding: "30px",
    background: "radial-gradient(circle at top, #0F172A, #020617)",
    minHeight: "100vh",
    color: "#E2E8F0",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "25px",
  },

  title: {
    fontSize: "28px",
    color: "#38BDF8",
    margin: 0,
  },

  subtitle: {
    color: "#94A3B8",
    fontSize: "13px",
  },

  actionBtn: {
    padding: "12px 18px",
    background: "linear-gradient(135deg, #38BDF8, #0EA5E9)",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    color: "#0F172A",
    fontWeight: "bold",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "15px",
    marginBottom: "25px",
  },

  card: {
    background: "rgba(17, 24, 39, 0.8)",
    padding: "18px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.05)",
  },

  section: {
    marginTop: "25px",
  },

  sectionTitle: {
    color: "#38BDF8",
    marginBottom: "10px",
  },

  insightBox: {
    background: "rgba(17, 24, 39, 0.6)",
    padding: "15px",
    borderRadius: "10px",
  },

  activityBox: {
    background: "rgba(17, 24, 39, 0.6)",
    padding: "15px",
    borderRadius: "10px",
  },

  activityItem: {
    padding: "8px 0",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  },

  loading: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    color: "#fff",
    background: "#0F172A",
  },
};