import { useEffect, useState } from "react";
import { auth, db } from "../../config/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

function StudentDashboard() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = auth.currentUser;

        if (!user) {
          navigate("/login");
          return;
        }

        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setUserData(docSnap.data());
        }
      } catch (error) {
        console.log(error.message);
      }

      setLoading(false);
    };

    fetchUser();
  }, [navigate]);

  if (loading) {
    return <div style={styles.loading}>Loading dashboard...</div>;
  }

  const isAllocated = userData?.roomAssigned;

  return (
    <div>
      {/* HEADER */}
      <h1 style={styles.welcome}>
        Welcome, {userData?.fullName} 👋
      </h1>

      <p style={styles.subText}>
        Smart Hostel Allocation System Overview
      </p>

      {/* STATUS BADGE */}
      <div style={styles.statusWrap}>
        <span
          style={{
            ...styles.badge,
            background: isAllocated ? "#22C55E" : "#F59E0B",
          }}
        >
          {isAllocated ? "ALLOCATED ✔" : "PENDING ALLOCATION ⏳"}
        </span>
      </div>

      {/* CARDS */}
      <div style={styles.cardGrid}>
        <div style={styles.card}>
          <h3>Matric Number</h3>
          <p>{userData?.matricNo}</p>
        </div>

        <div style={styles.card}>
          <h3>Email</h3>
          <p>{userData?.email}</p>
        </div>

        <div style={styles.card}>
          <h3>Level</h3>
          <p>{userData?.level || "Not Set"}</p>
        </div>

        <div style={styles.card}>
          <h3>Room ID</h3>
          <p>{userData?.roomId || "Not Assigned"}</p>
        </div>

        <div style={styles.cardHighlight}>
          <h3>Hostel Status</h3>
          <p>
            {isAllocated
              ? "You have been successfully allocated"
              : "Waiting for allocation"}
          </p>
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;
const styles = {
  welcome: {
    fontSize: "30px",
    marginBottom: "8px",
    color: "#F8FAFC",
  },

  subText: {
    color: "#94A3B8",
    marginBottom: "15px",
  },

  statusWrap: {
    marginBottom: "25px",
  },

  badge: {
    padding: "8px 14px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "bold",
    color: "#0F172A",
    display: "inline-block",
  },

  cardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "20px",
  },

  card: {
    background: "#1E293B",
    padding: "18px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.05)",
  },

  cardHighlight: {
    background: "linear-gradient(135deg,#38BDF8,#0EA5E9)",
    padding: "18px",
    borderRadius: "12px",
    color: "#0F172A",
    fontWeight: "bold",
  },

  loading: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#0F172A",
    color: "#fff",
    fontSize: "16px",
  },
};