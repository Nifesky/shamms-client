import { useEffect, useState } from "react";
import { db } from "../../config/firebase";
import {
  collection,
  getDocs,
  doc,
  getDoc
} from "firebase/firestore";

import { allocateRooms } from "../../utils/allocateRoom";

function AdminAllocation() {
  const [students, setStudents] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allocating, setAllocating] = useState(false);
  const [message, setMessage] = useState("");

  const fetchData = async () => {
    setLoading(true);

    try {
      // STUDENTS
      const usersSnap = await getDocs(collection(db, "users"));

      const studentList = usersSnap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(u =>
          u.role === "student"
        );

      setStudents(studentList);

      // ROOMS
      const roomsSnap = await getDocs(collection(db, "rooms"));

      const roomList = roomsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setRooms(roomList);

    } catch (err) {
      console.log(err);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const runAllocation = async () => {
    setAllocating(true);
    setMessage("");

    try {
      await allocateRooms();

      setMessage("✔ Allocation completed successfully");

      // refresh data
      await fetchData();

    } catch (err) {
      console.log(err);
      setMessage("❌ Allocation failed");
    }

    setAllocating(false);
  };

  const unassignedStudents = students.filter(
    s => !s.roomAssigned
  );

  const totalCapacity = rooms.reduce(
    (sum, r) => sum + (r.capacity || 0),
    0
  );

  const occupied = rooms.reduce(
    (sum, r) => sum + (r.occupants?.length || 0),
    0
  );

  if (loading) {
    return (
      <div style={styles.loading}>
        Loading allocation system...
      </div>
    );
  }

  return (
    <div style={styles.container}>

      {/* HEADER */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>
            Smart Room Allocation
          </h1>

          <p style={styles.subtitle}>
            Automatically assign students to rooms based on level & availability
          </p>
        </div>

        <button
          onClick={runAllocation}
          disabled={allocating}
          style={styles.button}
        >
          {allocating
            ? "Allocating..."
            : "Run Allocation Engine ⚡"}
        </button>
      </div>

      {message && (
        <p style={styles.message}>
          {message}
        </p>
      )}

      {/* STATS */}
      <div style={styles.grid}>

        <div style={styles.card}>
          <h3>Unassigned Students</h3>
          <p>{unassignedStudents.length}</p>
        </div>

        <div style={styles.card}>
          <h3>Total Rooms</h3>
          <p>{rooms.length}</p>
        </div>

        <div style={styles.card}>
          <h3>Total Capacity</h3>
          <p>{totalCapacity}</p>
        </div>

        <div style={styles.card}>
          <h3>Occupied Beds</h3>
          <p>{occupied}</p>
        </div>

      </div>

      {/* STUDENT LIST */}
      <div style={styles.tableCard}>
        <h3>Unassigned Students</h3>

        <table style={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Level</th>
              <th>Matric No</th>
            </tr>
          </thead>

          <tbody>
            {unassignedStudents.map(s => (
              <tr key={s.id}>
                <td>{s.fullName}</td>
                <td>{s.level}</td>
                <td>{s.matricNo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}

export default AdminAllocation;
const styles = {
  container: {
    color: "#E2E8F0",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "25px",
  },

  title: {
    fontSize: "26px",
    color: "#38BDF8",
    marginBottom: "5px",
  },

  subtitle: {
    fontSize: "13px",
    color: "#94A3B8",
  },

  button: {
    padding: "12px 16px",
    background: "linear-gradient(135deg,#38BDF8,#0EA5E9)",
    border: "none",
    borderRadius: "10px",
    color: "#0F172A",
    fontWeight: "bold",
    cursor: "pointer",
  },

  message: {
    marginBottom: "15px",
    color: "#22C55E",
    fontSize: "14px",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "15px",
    marginBottom: "25px",
  },

  card: {
    background: "#1E293B",
    padding: "15px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.05)",
  },

  tableCard: {
    background: "rgba(17,24,39,0.6)",
    padding: "15px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.05)",
  },

  table: {
    width: "100%",
    marginTop: "10px",
    borderCollapse: "collapse",
    fontSize: "14px",
  },

  loading: {
    color: "#E2E8F0",
    textAlign: "center",
    padding: "40px",
  },
};