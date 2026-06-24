import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  getDocs,
} from "firebase/firestore";
import { db } from "../../config/firebase";

function AdminHostels() {
  const [hostels, setHostels] = useState([]);

  const [hostelName, setHostelName] = useState("");
  const [gender, setGender] = useState("Male");

  const fetchHostels = async () => {
    const snap = await getDocs(collection(db, "hostels"));

    const data = snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    setHostels(data);
  };

  useEffect(() => {
    fetchHostels();
  }, []);

  const addHostel = async () => {
    if (!hostelName) return;

    await addDoc(collection(db, "hostels"), {
      hostelName,
      gender,
      createdAt: new Date().toISOString(),
    });

    setHostelName("");
    fetchHostels();
  };

  return (
    <div>
      <h1>Hostel Management</h1>

      <input
        placeholder="Hostel Name"
        value={hostelName}
        onChange={(e) => setHostelName(e.target.value)}
      />

      <select
        value={gender}
        onChange={(e) => setGender(e.target.value)}
      >
        <option>Male</option>
        <option>Female</option>
      </select>

      <button onClick={addHostel}>
        Add Hostel
      </button>

      {hostels.map((hostel) => (
        <div key={hostel.id}>
          {hostel.hostelName} ({hostel.gender})
        </div>
      ))}
    </div>
  );
}

export default AdminHostels;

/* STYLES */
const styles = {
  container: { color: "#E2E8F0" },

  title: { color: "#38BDF8" },

  form: {
    display: "flex",
    gap: "10px",
    marginBottom: "20px",
  },

  input: {
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #334155",
    background: "#0F172A",
    color: "#E2E8F0",
  },

  button: {
    background: "#38BDF8",
    border: "none",
    padding: "10px",
    borderRadius: "8px",
    cursor: "pointer",
  },

  list: {
    display: "grid",
    gap: "10px",
  },

  card: {
    background: "#1E293B",
    padding: "15px",
    borderRadius: "10px",
    display: "flex",
    justifyContent: "space-between",
  },

  delete: {
    background: "#EF4444",
    border: "none",
    padding: "8px",
    borderRadius: "6px",
    cursor: "pointer",
    color: "white",
  },
};