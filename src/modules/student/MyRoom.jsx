import { useEffect, useState } from "react";
import { auth, db } from "../../config/firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";

function MyRoom() {
  const [user, setUser] = useState(null);
  const [room, setRoom] = useState(null);
  const [roommates, setRoommates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        // 1. Get user
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) return;

        const userData = userSnap.data();
        setUser(userData);

        if (!userData.roomId) {
          setLoading(false);
          return;
        }

        // 2. Get room
        const roomRef = doc(db, "rooms", userData.roomId);
        const roomSnap = await getDoc(roomRef);

        if (roomSnap.exists()) {
          setRoom(roomSnap.data());
        }

        // 3. Get roommates (same roomId)
        const usersSnap = await getDocs(collection(db, "users"));

        const mates = usersSnap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter(
            (u) =>
              u.roomId === userData.roomId &&
              u.id !== currentUser.uid
          );

        setRoommates(mates);
      } catch (err) {
        console.log(err);
      }

      setLoading(false);
    };

    fetchRoomData();
  }, []);

  if (loading) {
    return <div style={styles.loading}>Loading room details...</div>;
  }

  if (!user?.roomId) {
    return (
      <div style={styles.empty}>
        <h2>No Room Assigned Yet ⏳</h2>
        <p>Please wait for allocation to be completed.</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <h1 style={styles.title}>My Room</h1>
      <p style={styles.subtitle}>
        Your allocated hostel and room details
      </p>

      {/* ROOM CARD */}
      <div style={styles.roomCard}>
        <h2>🏠 Room Information</h2>

        <div style={styles.grid}>
          <div style={styles.box}>
            <h4>Room ID</h4>
            <p>{user.roomId}</p>
          </div>

          <div style={styles.box}>
            <h4>Capacity</h4>
            <p>{room?.capacity || "N/A"}</p>
          </div>

          <div style={styles.box}>
            <h4>Occupants</h4>
            <p>
              {room?.occupants?.length || 0}
            </p>
          </div>
        </div>
      </div>

      {/* ROOMMATES */}
      <div style={styles.section}>
        <h2>👥 Roommates</h2>

        {roommates.length === 0 ? (
          <p style={styles.text}>
            You are the only assigned occupant yet.
          </p>
        ) : (
          <div style={styles.list}>
            {roommates.map((mate) => (
              <div key={mate.id} style={styles.mateCard}>
                <p style={styles.name}>
                  {mate.fullName}
                </p>
                <p style={styles.meta}>
                  {mate.matricNo}
                </p>
                <p style={styles.meta}>
                  Level: {mate.level || "N/A"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyRoom;

const styles = {
  container: {
    color: "#E2E8F0",
  },

  title: {
    fontSize: "28px",
    color: "#38BDF8",
  },

  subtitle: {
    fontSize: "13px",
    color: "#94A3B8",
    marginBottom: "20px",
  },

  roomCard: {
    background: "#1E293B",
    padding: "20px",
    borderRadius: "12px",
    marginBottom: "25px",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "15px",
    marginTop: "10px",
  },

  box: {
    background: "#0F172A",
    padding: "15px",
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.05)",
  },

  section: {
    marginTop: "20px",
  },

  list: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "15px",
    marginTop: "10px",
  },

  mateCard: {
    background: "#1E293B",
    padding: "15px",
    borderRadius: "10px",
  },

  name: {
    fontWeight: "bold",
    marginBottom: "5px",
  },

  meta: {
    fontSize: "12px",
    color: "#94A3B8",
  },

  text: {
    color: "#94A3B8",
  },

  empty: {
    textAlign: "center",
    padding: "40px",
    color: "#94A3B8",
  },

  loading: {
    color: "#E2E8F0",
    textAlign: "center",
    padding: "40px",
  },
};