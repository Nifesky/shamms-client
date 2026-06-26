import { useEffect, useState } from "react";
import { db } from "../../config/firebase";
import {
  collection,
  getDocs,
} from "firebase/firestore";

function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [totalStudents, setTotalStudents] = useState(0);
  const [allocatedStudents, setAllocatedStudents] = useState(0);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const usersSnap = await getDocs(collection(db, "users"));

      const studentData = usersSnap.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter((user) => user.role === "student");

      setStudents(studentData);

      setTotalStudents(studentData.length);

      const allocated = studentData.filter(
        (student) => student.roomAssigned
      );

      setAllocatedStudents(allocated.length);

    } catch (error) {
      console.log(error.message);
    }

    setLoading(false);
  };

  const filteredStudents = students.filter(
    (student) =>
      student.fullName
        ?.toLowerCase()
        .includes(search.toLowerCase()) ||
      student.matricNo
        ?.toLowerCase()
        .includes(search.toLowerCase()) ||
      student.email
        ?.toLowerCase()
        .includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div style={styles.loading}>
        Loading Students...
      </div>
    );
  }

  return (
    <div style={styles.container}>

      {/* HEADER */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>
            Students Management
          </h1>

          <p style={styles.subtitle}>
            Manage all registered students
          </p>
        </div>

        <input
          type="text"
          placeholder="Search student..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.search}
        />
      </div>

      {/* STATS */}
      <div style={styles.statsGrid}>

        <div style={styles.statCard}>
          <h3>Total Students</h3>
          <h1>{totalStudents}</h1>
        </div>

        <div style={styles.statCard}>
          <h3>Allocated</h3>
          <h1>{allocatedStudents}</h1>
        </div>

        <div style={styles.statCard}>
          <h3>Pending Allocation</h3>
          <h1>
            {totalStudents - allocatedStudents}
          </h1>
        </div>

      </div>

      {/* TABLE */}
      <div style={styles.tableCard}>

        <table style={styles.table}>

          <thead>
            <tr>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Matric No</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Room</th>
              <th style={styles.th}>Status</th>
            </tr>
          </thead>

          <tbody>

            {filteredStudents.length > 0 ? (
              filteredStudents.map((student) => (
                <tr key={student.id}>
                  <td style={styles.td}>
                    {student.fullName}
                  </td>

                  <td style={styles.td}>
                    {student.matricNo}
                  </td>

                  <td style={styles.td}>
                    {student.email}
                  </td>

                  <td style={styles.td}>
                    {student.roomNumber || "Not Assigned"}
                  </td>

                  <td style={styles.td}>
                    {student.roomAssigned ? (
                      <span style={styles.successBadge}>
                        Allocated
                      </span>
                    ) : (
                      <span style={styles.pendingBadge}>
                        Pending
                      </span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="5"
                  style={styles.empty}
                >
                  No Students Found
                </td>
              </tr>
            )}

          </tbody>

        </table>

      </div>
    </div>
  );
}

export default AdminStudents;

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
    color: "#38BDF8",
    margin: 0,
    fontSize: "28px",
  },

  subtitle: {
    color: "#94A3B8",
    marginTop: "5px",
  },

  search: {
    width: "250px",
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.08)",
    background: "#111827",
    color: "#fff",
    outline: "none",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "20px",
    marginBottom: "25px",
  },

  statCard: {
    background: "rgba(17,24,39,0.7)",
    backdropFilter: "blur(12px)",
    borderRadius: "15px",
    padding: "20px",
    border: "1px solid rgba(255,255,255,0.05)",
  },

  tableCard: {
    background: "rgba(17,24,39,0.7)",
    backdropFilter: "blur(12px)",
    borderRadius: "15px",
    padding: "20px",
    border: "1px solid rgba(255,255,255,0.05)",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
  },

  th: {
    textAlign: "left",
    padding: "15px",
    color: "#94A3B8",
    borderBottom:
      "1px solid rgba(255,255,255,0.05)",
  },

  td: {
    padding: "15px",
    borderBottom:
      "1px solid rgba(255,255,255,0.05)",
  },

  successBadge: {
    background: "#10B981",
    color: "#fff",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "12px",
  },

  pendingBadge: {
    background: "#F59E0B",
    color: "#fff",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "12px",
  },

  empty: {
    textAlign: "center",
    padding: "25px",
    color: "#94A3B8",
  },

  loading: {
    color: "#fff",
    textAlign: "center",
    padding: "50px",
  },
};