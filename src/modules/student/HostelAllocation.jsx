import { useEffect, useState } from "react";
import { auth, db } from "../../config/firebase";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";

function HostelAllocation() {
  const [hostels, setHostels] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedHostel, setSelectedHostel] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // FETCH HOSTELS
  useEffect(() => {
    const fetchHostels = async () => {
      const snapshot = await getDocs(collection(db, "hostels"));
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setHostels(data);
    };

    fetchHostels();
  }, []);

  // FETCH ROOMS WHEN HOSTEL IS SELECTED
  const handleHostelSelect = async (hostelId) => {
    setSelectedHostel(hostelId);

    const snapshot = await getDocs(collection(db, "rooms"));
    const data = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((room) => room.hostelId === hostelId);

    setRooms(data);
  };

  // ALLOCATE ROOM
  const handleAllocate = async (room) => {
    setLoading(true);

    try {
      const user = auth.currentUser;

      if (!user) {
        navigate("/login");
        return;
      }

      // CHECK IF ROOM IS FULL
      if (room.occupiedSlots >= room.capacity) {
        alert("Room is full");
        return;
      }

      // CREATE ALLOCATION
      const allocationId = `${user.uid}_${room.id}`;

      await setDoc(doc(db, "allocations", allocationId), {
        studentId: user.uid,
        roomId: room.id,
        hostelId: room.hostelId,
        allocationDate: new Date().toISOString(),
      });

      // UPDATE ROOM OCCUPANCY
      const roomRef = doc(db, "rooms", room.id);
      const roomSnap = await getDoc(roomRef);

      if (roomSnap.exists()) {
        const current = roomSnap.data().occupiedSlots || 0;

        await setDoc(
          roomRef,
          {
            ...roomSnap.data(),
            occupiedSlots: current + 1,
          },
          { merge: true }
        );
      }

      alert("Room allocated successfully!");

      navigate("/student/dashboard");
    } catch (error) {
      console.log(error.message);
      alert("Allocation failed");
    }

    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <h2>Hostel Allocation</h2>
      <p>Select a hostel to view available rooms</p>

      {/* HOSTELS */}
      <div style={styles.grid}>
        {hostels.map((hostel) => (
          <div
            key={hostel.id}
            style={styles.card}
            onClick={() => handleHostelSelect(hostel.id)}
          >
            <h3>{hostel.hostelName}</h3>
            <p>Gender: {hostel.gender}</p>
            <p>Total Rooms: {hostel.totalRooms}</p>
          </div>
        ))}
      </div>

      {/* ROOMS */}
      {selectedHostel && (
        <>
          <h3>Available Rooms</h3>

          <div style={styles.grid}>
            {rooms.map((room) => (
              <div key={room.id} style={styles.card}>
                <h4>Room {room.roomNumber}</h4>
                <p>
                  Capacity: {room.capacity} | Occupied: {room.occupiedSlots}
                </p>

                <button
                  style={styles.button}
                  disabled={loading}
                  onClick={() => handleAllocate(room)}
                >
                  Allocate Room
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default HostelAllocation;

/* ================= STYLES ================= */

const styles = {
  container: {
    padding: "30px",
    backgroundColor: "#F8FAFC",
    minHeight: "100vh",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "15px",
    marginTop: "20px",
  },

  card: {
    backgroundColor: "#fff",
    padding: "15px",
    borderRadius: "10px",
    boxShadow: "0 5px 15px rgba(0,0,0,0.05)",
    cursor: "pointer",
  },

  button: {
    marginTop: "10px",
    padding: "8px",
    backgroundColor: "#F4B400",
    border: "none",
    color: "#fff",
    cursor: "pointer",
    borderRadius: "6px",
    width: "100%",
  },
};