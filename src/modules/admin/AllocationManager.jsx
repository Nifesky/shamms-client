import { useEffect, useState } from "react";
import { db } from "../../config/firebase";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  query,
  where
} from "firebase/firestore";

function AllocationManager() {
  const [students, setStudents] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedRoom, setSelectedRoom] = useState("");
  const [loading, setLoading] = useState(true);

  // FETCH STUDENTS + ROOMS
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Students only
        const usersSnap = await getDocs(collection(db, "users"));
        const studentList = usersSnap.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(user => user.role === "student");

        setStudents(studentList);

        // Rooms
        const roomsSnap = await getDocs(collection(db, "rooms"));
        const roomList = roomsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setRooms(roomList);

      } catch (error) {
        console.log(error.message);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  // ASSIGN ROOM FUNCTION
  const handleAllocate = async () => {
    if (!selectedStudent || !selectedRoom) {
      alert("Select student and room");
      return;
    }

    try {
      const allocationRef = doc(db, "allocations", selectedStudent);

      await setDoc(allocationRef, {
        studentId: selectedStudent,
        roomId: selectedRoom,
        allocationDate: new Date().toISOString(),
      });

      alert("Room allocated successfully ✔");

      setSelectedStudent("");
      setSelectedRoom("");

    } catch (error) {
      console.log(error.message);
      alert("Allocation failed");
    }
  };

  if (loading) {
    return <p style={{ color: "#fff" }}>Loading admin allocation...</p>;
  }

  return (
    <div style={styles.container}>

      <h1 style={styles.title}>Admin Room Allocation</h1>

      {/* STUDENT SELECT */}
      <div style={styles.card}>
        <h3>Select Student</h3>

        <select
          value={selectedStudent}
          onChange={(e) => setSelectedStudent(e.target.value)}
          style={styles.select}
        >
          <option value="">-- Choose Student --</option>

          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.fullName} ({s.matricNo})
            </option>
          ))}
        </select>
      </div>

      {/* ROOM SELECT */}
      <div style={styles.card}>
        <h3>Select Room</h3>

        <select
          value={selectedRoom}
          onChange={(e) => setSelectedRoom(e.target.value)}
          style={styles.select}
        >
          <option value="">-- Choose Room --</option>

          {rooms.map((r) => (
            <option key={r.id} value={r.roomNumber}>
              {r.roomNumber} (Capacity: {r.capacity})
            </option>
          ))}
        </select>
      </div>

      {/* BUTTON */}
      <button onClick={handleAllocate} style={styles.button}>
        Allocate Room
      </button>

    </div>
  );
}

export default AllocationManager;

/* ================= STYLES ================= */

const styles = {
  container: {
    padding: "30px",
    color: "#E2E8F0",
  },

  title: {
    marginBottom: "20px",
  },

  card: {
    backgroundColor: "#1E293B",
    padding: "20px",
    marginBottom: "15px",
    borderRadius: "10px",
  },

  select: {
    width: "100%",
    padding: "10px",
    marginTop: "10px",
    borderRadius: "6px",
  },

  button: {
    marginTop: "20px",
    padding: "12px",
    backgroundColor: "#38BDF8",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
  },
};