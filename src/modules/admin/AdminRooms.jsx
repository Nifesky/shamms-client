import { useEffect, useState } from "react";
import { db } from "../../config/firebase";
import {
  collection,
  addDoc,
  getDocs,
} from "firebase/firestore";

function AdminRooms() {
  const [hostelId, setHostelId] = useState("");
  const [roomNo, setRoomNo] = useState("");
  const [capacity, setCapacity] = useState("");

  const [rooms, setRooms] = useState([]);
  const [hostels, setHostels] = useState([]);

  useEffect(() => {
    getDocs(collection(db, "hostels")).then((snap) => {
      setHostels(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    getDocs(collection(db, "rooms")).then((snap) => {
      setRooms(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, []);

  const addRoom = async (e) => {
    e.preventDefault();

    await addDoc(collection(db, "rooms"), {
      hostelId,
      roomNo,
      capacity: Number(capacity),
      occupants: [],
    });

    window.location.reload();
  };

  return (
    <div style={styles.container}>
      <h2>Rooms</h2>

      <form onSubmit={addRoom} style={styles.form}>
        <select
          value={hostelId}
          onChange={(e) => setHostelId(e.target.value)}
          style={styles.input}
        >
          <option>Select Hostel</option>
          {hostels.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name}
            </option>
          ))}
        </select>

        <input
          placeholder="Room No"
          value={roomNo}
          onChange={(e) => setRoomNo(e.target.value)}
          style={styles.input}
        />

        <input
          placeholder="Capacity (4,6,8)"
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
          style={styles.input}
        />

        <button style={styles.button}>Add Room</button>
      </form>

      <div>
        {rooms.map((r) => (
          <div key={r.id} style={styles.card}>
            Room {r.roomNo} | Capacity: {r.capacity}
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminRooms;

/* styles reused */
const styles = {
  container: { color: "#E2E8F0" },
  form: { display: "flex", gap: "10px", marginBottom: "20px" },
  input: {
    padding: "10px",
    borderRadius: "8px",
    background: "#0F172A",
    color: "#E2E8F0",
    border: "1px solid #334155",
  },
  button: {
    background: "#38BDF8",
    border: "none",
    padding: "10px",
    borderRadius: "8px",
  },
  card: {
    background: "#1E293B",
    padding: "10px",
    marginBottom: "10px",
  },
};