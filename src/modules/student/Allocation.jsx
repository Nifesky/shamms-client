import { useEffect, useState } from "react";
import { auth, db } from "../../config/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

function Allocation() {
  const [roomData, setRoomData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllocation = async () => {
      try {
        const user = auth.currentUser;

        if (!user) {
          setLoading(false);
          return;
        }

        const q = query(
          collection(db, "allocations"),
          where("studentId", "==", user.uid)
        );

        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          // get first allocation
          setRoomData(querySnapshot.docs[0].data());
        } else {
          setRoomData(null);
        }

      } catch (error) {
        console.log(error.message);
      }

      setLoading(false);
    };

    fetchAllocation();
  }, []);

  if (loading) {
    return (
      <div style={styles.loading}>
        Loading My Room...
      </div>
    );
  }

  return (
    <div style={styles.container}>

      <h1 style={styles.title}>My Room</h1>
      <p style={styles.subtitle}>
        Your hostel allocation details
      </p>

      {roomData ? (
        <div style={styles.card}>
          <h2>Room Number</h2>
          <p style={styles.value}>{roomData.roomId}</p>

          <h3>Hostel</h3>
          <p>{roomData.hostelName || "Not specified"}</p>

          <h3>Allocation Date</h3>
          <p>{roomData.allocationDate}</p>

          <div style={styles.status}>
            ✓ Allocated
          </div>
        </div>
      ) : (
        <div style={styles.emptyCard}>
          <h2>No Room Assigned Yet</h2>
          <p>Please complete payment and wait for admin allocation.</p>
        </div>
      )}

    </div>
  );
}

export default Allocation;

/* ================= STYLES ================= */

const styles = {
  container: {
    padding: "30px",
    color: "#E2E8F0",
  },

  title: {
    fontSize: "28px",
    marginBottom: "5px",
  },

  subtitle: {
    color: "#94A3B8",
    marginBottom: "30px",
  },

  card: {
    backgroundColor: "#1E293B",
    padding: "25px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.05)",
    maxWidth: "400px",
  },

  value: {
    fontSize: "22px",
    fontWeight: "bold",
    color: "#38BDF8",
  },

  status: {
    marginTop: "15px",
    padding: "8px",
    backgroundColor: "#10B981",
    color: "#0F172A",
    borderRadius: "6px",
    display: "inline-block",
    fontWeight: "bold",
  },

  emptyCard: {
    backgroundColor: "#1E293B",
    padding: "25px",
    borderRadius: "12px",
    textAlign: "center",
    border: "1px solid rgba(255,255,255,0.05)",
  },

  loading: {
    padding: "40px",
    color: "#E2E8F0",
  },
};