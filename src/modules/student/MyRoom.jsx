import { useEffect, useState } from "react";
import { auth, db } from "../../config/firebase";
import {
  doc,
  getDoc,
} from "firebase/firestore";

function MyRoom() {
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [hostel, setHostel] = useState(null);
  const [room, setRoom] = useState(null);

  useEffect(() => {
    fetchRoomDetails();
  }, []);

  const fetchRoomDetails = async () => {
    try {
      const user = auth.currentUser;

      if (!user) return;

      const userSnap = await getDoc(
        doc(db, "users", user.uid)
      );

      if (!userSnap.exists()) {
        setLoading(false);
        return;
      }

      const userData = userSnap.data();
      setStudent(userData);

      if (userData.hostelId) {
        const hostelSnap = await getDoc(
          doc(db, "hostels", userData.hostelId)
        );

        if (hostelSnap.exists()) {
          setHostel(hostelSnap.data());
        }
      }

      if (userData.roomId) {
        const roomSnap = await getDoc(
          doc(db, "rooms", userData.roomId)
        );

        if (roomSnap.exists()) {
          setRoom(roomSnap.data());
        }
      }
    } catch (err) {
      console.log(err);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        Loading Room Information...
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>My Room</h1>

      {!student?.roomAssigned ? (
        <div style={styles.emptyCard}>
          <h2>No Room Assigned Yet</h2>

          <p>
            Your hostel allocation has not been
            completed by the administrator.
          </p>
        </div>
      ) : (
        <>
          {/* ROOM CARD */}

          <div style={styles.roomCard}>
            <div>
              <h2 style={styles.hostelName}>
                {hostel?.hostelName}
              </h2>

              <p style={styles.roomNo}>
                Room {room?.roomNumber}
              </p>
            </div>

            <div style={styles.statusBadge}>
              Allocated
            </div>
          </div>

          {/* DETAILS GRID */}

          <div style={styles.grid}>
            <div style={styles.card}>
              <h3>Student Name</h3>
              <p>{student?.fullName}</p>
            </div>

            <div style={styles.card}>
              <h3>Matric Number</h3>
              <p>{student?.matricNo}</p>
            </div>

            <div style={styles.card}>
              <h3>Room Capacity</h3>
              <p>{room?.capacity} Students</p>
            </div>

            <div style={styles.card}>
              <h3>Occupants</h3>
              <p>
                {room?.occupants?.length || 0}/
                {room?.capacity}
              </p>
            </div>

            <div style={styles.card}>
              <h3>Gender Hostel</h3>
              <p>{hostel?.gender}</p>
            </div>

            <div style={styles.card}>
              <h3>Payment Status</h3>
              <p
                style={{
                  color:
                    student?.paymentStatus ===
                    "verified"
                      ? "#22C55E"
                      : "#F59E0B",
                }}
              >
                {student?.paymentStatus}
              </p>
            </div>
          </div>

          {/* SUMMARY */}

          <div style={styles.summary}>
            <h3>Accommodation Summary</h3>

            <p>
              You have been allocated to
              <strong>
                {" "}
                {hostel?.hostelName}
              </strong>
              , Room
              <strong>
                {" "}
                {room?.roomNumber}
              </strong>
              .
            </p>

            <p>
              Capacity:
              <strong>
                {" "}
                {room?.capacity}
              </strong>{" "}
              students.
            </p>

            <p>
              Current Occupants:
              <strong>
                {" "}
                {room?.occupants?.length || 0}
              </strong>
            </p>
          </div>
        </>
      )}
    </div>
  );
}

export default MyRoom;

/* ================= STYLES ================= */

const styles = {
  container: {
    color: "#E2E8F0",
  },

  title: {
    fontSize: "30px",
    marginBottom: "25px",
    color: "#38BDF8",
  },

  roomCard: {
    background:
      "linear-gradient(135deg,#38BDF8,#0EA5E9)",
    padding: "25px",
    borderRadius: "16px",
    color: "#0F172A",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "25px",
  },

  hostelName: {
    margin: 0,
    fontSize: "28px",
  },

  roomNo: {
    marginTop: "8px",
    fontWeight: "bold",
  },

  statusBadge: {
    background: "#0F172A",
    color: "#38BDF8",
    padding: "10px 18px",
    borderRadius: "30px",
    fontWeight: "bold",
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(250px,1fr))",
    gap: "20px",
    marginBottom: "25px",
  },

  card: {
    background: "#1E293B",
    padding: "20px",
    borderRadius: "14px",
    border:
      "1px solid rgba(255,255,255,0.05)",
  },

  summary: {
    background: "#1E293B",
    padding: "25px",
    borderRadius: "14px",
  },

  emptyCard: {
    background: "#1E293B",
    padding: "40px",
    borderRadius: "16px",
    textAlign: "center",
  },

  loading: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "60vh",
    color: "#E2E8F0",
    fontSize: "18px",
  },
};