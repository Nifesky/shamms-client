import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
} from "firebase/firestore";
import { db } from "../../config/firebase";

function AdminRooms() {
  const [rooms, setRooms] = useState([]);
  const [hostels, setHostels] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const hostelSnap = await getDocs(
        collection(db, "hostels")
      );

      const roomSnap = await getDocs(
        collection(db, "rooms")
      );

      setHostels(
        hostelSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
      );

      setRooms(
        roomSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
      );
    } catch (err) {
      console.log(err);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div style={styles.loading}>
        Loading Rooms...
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>
        Room Management
      </h1>

      <p style={styles.subtitle}>
        Monitor hostel rooms and occupancy
      </p>

      <input
        placeholder="Search Room Number..."
        value={search}
        onChange={(e) =>
          setSearch(e.target.value)
        }
        style={styles.search}
      />

      {hostels.map((hostel) => {
        const hostelRooms = rooms.filter(
          (room) =>
            room.hostelId === hostel.id &&
            room.roomNumber
              ?.toLowerCase()
              .includes(search.toLowerCase())
        );

        const occupiedBeds = hostelRooms.reduce(
          (sum, room) =>
            sum +
            (room.occupants?.length || 0),
          0
        );

        const totalBeds = hostelRooms.reduce(
          (sum, room) =>
            sum + (room.capacity || 0),
          0
        );

        return (
          <div
            key={hostel.id}
            style={styles.hostelCard}
          >
            <div style={styles.hostelHeader}>
              <div>
                <h2>
                  {hostel.hostelName}
                </h2>

                <p>
                  {hostel.gender} Hostel
                </p>
              </div>

              <div>
                <p>
                  Rooms: {hostelRooms.length}
                </p>

                <p>
                  Beds: {occupiedBeds}/
                  {totalBeds}
                </p>
              </div>
            </div>

            <div style={styles.roomGrid}>
              {hostelRooms.map((room) => {
                const occupied =
                  room.occupants?.length || 0;

                const available =
                  room.capacity - occupied;

                const full =
                  occupied >= room.capacity;

                return (
                  <div
                    key={room.id}
                    style={styles.roomCard}
                  >
                    <h3>
                      {room.roomNumber}
                    </h3>

                    <p>
                      Capacity:
                      {" "}
                      {room.capacity}
                    </p>

                    <p>
                      Occupied:
                      {" "}
                      {occupied}
                    </p>

                    <p>
                      Available:
                      {" "}
                      {available}
                    </p>

                    <span
                      style={{
                        ...styles.status,
                        background: full
                          ? "#EF4444"
                          : "#22C55E",
                      }}
                    >
                      {full
                        ? "FULL"
                        : "AVAILABLE"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default AdminRooms;

const styles = {
  container: {
    color: "#E2E8F0",
  },

  title: {
    color: "#38BDF8",
    fontSize: "28px",
    marginBottom: "5px",
  },

  subtitle: {
    color: "#94A3B8",
    marginBottom: "20px",
  },

  search: {
    width: "100%",
    padding: "12px",
    marginBottom: "25px",
    borderRadius: "10px",
    border: "1px solid #334155",
    background: "#0F172A",
    color: "#E2E8F0",
  },

  hostelCard: {
    background: "#1E293B",
    borderRadius: "16px",
    padding: "20px",
    marginBottom: "25px",
    border:
      "1px solid rgba(255,255,255,0.05)",
  },

  hostelHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "20px",
    borderBottom:
      "1px solid rgba(255,255,255,0.05)",
    paddingBottom: "15px",
  },

  roomGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(220px,1fr))",
    gap: "15px",
  },

  roomCard: {
    background: "#0F172A",
    padding: "15px",
    borderRadius: "12px",
    border:
      "1px solid rgba(255,255,255,0.05)",
  },

  status: {
    display: "inline-block",
    marginTop: "10px",
    padding: "6px 12px",
    borderRadius: "20px",
    color: "#fff",
    fontSize: "12px",
    fontWeight: "bold",
  },

  loading: {
    color: "#E2E8F0",
    textAlign: "center",
    padding: "50px",
  },
};