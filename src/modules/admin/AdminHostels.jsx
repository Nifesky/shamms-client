import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
} from "firebase/firestore";
import { db } from "../../config/firebase";

function AdminHostels() {
  const [hostels, setHostels] = useState([]);

  const [hostelName, setHostelName] = useState("");
  const [gender, setGender] = useState("Male");
  const [roomCapacity, setRoomCapacity] = useState(4);
  const [totalRooms, setTotalRooms] = useState(10);
  const [hostelPrice, setHostelPrice] = useState("");

  const fetchHostels = async () => {
    try {
      const snap = await getDocs(collection(db, "hostels"));

      const data = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setHostels(data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchHostels();
  }, []);

  const addHostel = async () => {
    try {
      if (
        !hostelName ||
        !hostelPrice ||
        !roomCapacity ||
        !totalRooms
      ) {
        alert("Please fill all fields");
        return;
      }

      const hostelRef = await addDoc(
        collection(db, "hostels"),
        {
          hostelName,
          gender,
          roomCapacity: Number(roomCapacity),
          totalRooms: Number(totalRooms),
          hostelPrice: Number(hostelPrice),
          createdAt: new Date().toISOString(),
        }
      );

      for (let i = 1; i <= totalRooms; i++) {
        await addDoc(collection(db, "rooms"), {
          hostelId: hostelRef.id,

          roomNumber:
            hostelName.charAt(0).toUpperCase() +
            String(i).padStart(3, "0"),

          capacity: Number(roomCapacity),

          occupants: [],

          createdAt: new Date().toISOString(),
        });
      }

      alert("Hostel Added Successfully");

      setHostelName("");
      setGender("Male");
      setRoomCapacity(4);
      setTotalRooms(10);
      setHostelPrice("");

      fetchHostels();
    } catch (err) {
      console.log(err);
      alert("Error creating hostel");
    }
  };

  const deleteHostel = async (hostelId) => {
    const confirmDelete = window.confirm(
      "Delete hostel and all associated rooms?"
    );

    if (!confirmDelete) return;

    try {
      const roomsQuery = query(
        collection(db, "rooms"),
        where("hostelId", "==", hostelId)
      );

      const roomSnap = await getDocs(roomsQuery);

      for (const room of roomSnap.docs) {
        await deleteDoc(doc(db, "rooms", room.id));
      }

      await deleteDoc(doc(db, "hostels", hostelId));

      alert("Hostel deleted");

      fetchHostels();
    } catch (err) {
      console.log(err);
      alert("Failed to delete hostel");
    }
  };

  const totalHostels = hostels.length;

  const totalRoomsCount = hostels.reduce(
    (sum, hostel) => sum + (hostel.totalRooms || 0),
    0
  );

  const totalBedSpaces = hostels.reduce(
    (sum, hostel) =>
      sum +
      (hostel.totalRooms || 0) *
        (hostel.roomCapacity || 0),
    0
  );

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>
        Hostel Management
      </h1>

      <p style={styles.subtitle}>
        Create and manage hostel facilities
      </p>

      {/* STATISTICS */}

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <h3>{totalHostels}</h3>
          <p>Total Hostels</p>
        </div>

        <div style={styles.statCard}>
          <h3>{totalRoomsCount}</h3>
          <p>Total Rooms</p>
        </div>

        <div style={styles.statCard}>
          <h3>{totalBedSpaces}</h3>
          <p>Total Bed Spaces</p>
        </div>
      </div>

      {/* FORM */}

      <div style={styles.form}>
        <input
          placeholder="Hostel Name"
          value={hostelName}
          onChange={(e) =>
            setHostelName(e.target.value)
          }
          style={styles.input}
        />

        <select
          value={gender}
          onChange={(e) =>
            setGender(e.target.value)
          }
          style={styles.input}
        >
          <option>Male</option>
          <option>Female</option>
        </select>

        <input
          type="number"
          placeholder="Room Capacity"
          value={roomCapacity}
          onChange={(e) =>
            setRoomCapacity(e.target.value)
          }
          style={styles.input}
        />

        <input
          type="number"
          placeholder="Number of Rooms"
          value={totalRooms}
          onChange={(e) =>
            setTotalRooms(e.target.value)
          }
          style={styles.input}
        />

        <input
          type="number"
          placeholder="Hostel Price"
          value={hostelPrice}
          onChange={(e) =>
            setHostelPrice(e.target.value)
          }
          style={styles.input}
        />

        <button
          onClick={addHostel}
          style={styles.button}
        >
          Add Hostel
        </button>
      </div>

      {/* HOSTEL CARDS */}

      <div style={styles.list}>
        {hostels.map((hostel) => (
          <div
            key={hostel.id}
            style={styles.card}
          >
            <div style={styles.header}>
              <h3>{hostel.hostelName}</h3>

              <span style={styles.gender}>
                {hostel.gender}
              </span>
            </div>

            <p>
              Rooms:
              <strong>
                {" "}
                {hostel.totalRooms}
              </strong>
            </p>

            <p>
              Capacity Per Room:
              <strong>
                {" "}
                {hostel.roomCapacity}
              </strong>
            </p>

            <p>
              Total Bed Spaces:
              <strong>
                {" "}
                {hostel.totalRooms *
                  hostel.roomCapacity}
              </strong>
            </p>

            <p>
              Hostel Fee:
              <strong>
                {" "}
                ₦
                {hostel.hostelPrice?.toLocaleString()}
              </strong>
            </p>

            <button
              style={styles.deleteBtn}
              onClick={() =>
                deleteHostel(hostel.id)
              }
            >
              Delete Hostel
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminHostels;

const styles = {
  container: {
    color: "#E2E8F0",
  },

  title: {
    fontSize: "30px",
    color: "#38BDF8",
    marginBottom: "5px",
  },

  subtitle: {
    color: "#94A3B8",
    marginBottom: "25px",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(220px,1fr))",
    gap: "15px",
    marginBottom: "25px",
  },

  statCard: {
    background: "#1E293B",
    padding: "20px",
    borderRadius: "14px",
    textAlign: "center",
  },

  form: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(220px,1fr))",
    gap: "12px",
    marginBottom: "30px",
  },

  input: {
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #334155",
    background: "#0F172A",
    color: "#E2E8F0",
  },

  button: {
    background:
      "linear-gradient(135deg,#38BDF8,#0EA5E9)",
    border: "none",
    borderRadius: "10px",
    padding: "12px",
    cursor: "pointer",
    color: "#0F172A",
    fontWeight: "bold",
  },

  list: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(300px,1fr))",
    gap: "20px",
  },

  card: {
    background: "#1E293B",
    padding: "20px",
    borderRadius: "15px",
    border:
      "1px solid rgba(255,255,255,0.05)",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "15px",
  },

  gender: {
    background: "#38BDF8",
    color: "#0F172A",
    padding: "5px 10px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "bold",
  },

  deleteBtn: {
    marginTop: "15px",
    width: "100%",
    padding: "10px",
    border: "none",
    borderRadius: "10px",
    background: "#EF4444",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "bold",
  },
};