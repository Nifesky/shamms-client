import { useEffect, useState } from "react";
import { db } from "../../config/firebase";
import {
  collection,
  getDocs,
  doc,
  updateDoc
} from "firebase/firestore";

function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = async () => {
    setLoading(true);

    try {
      const snap = await getDocs(collection(db, "payments"));

      const data = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setPayments(data);
    } catch (err) {
      console.log(err);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await updateDoc(doc(db, "payments", id), {
        status
      });

      fetchPayments();
    } catch (err) {
      console.log(err);
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading payments...</div>;
  }

  return (
    <div style={styles.container}>

      <h2 style={styles.title}>Payment Management</h2>
      <p style={styles.subtitle}>
        Approve or reject student payments
      </p>

      <div style={styles.tableCard}>
        <table style={styles.table}>

          <thead>
            <tr>
              <th>Name</th>
              <th>Matric No</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {payments.map(p => (
              <tr key={p.id}>

                <td>{p.fullName}</td>
                <td>{p.matricNo}</td>
                <td>₦{p.amount}</td>

                <td>
                  <span style={{
                    ...styles.badge,
                    background:
                      p.status === "Approved"
                        ? "#22C55E"
                        : p.status === "Rejected"
                        ? "#EF4444"
                        : "#F59E0B"
                  }}>
                    {p.status || "Pending"}
                  </span>
                </td>

                <td style={styles.actions}>
                  <button
                    onClick={() => updateStatus(p.id, "Approved")}
                    style={styles.approve}
                  >
                    Approve
                  </button>

                  <button
                    onClick={() => updateStatus(p.id, "Rejected")}
                    style={styles.reject}
                  >
                    Reject
                  </button>
                </td>

              </tr>
            ))}
          </tbody>

        </table>
      </div>
    </div>
  );
}

export default AdminPayments;
const styles = {
  container: {
    color: "#E2E8F0",
  },

  title: {
    fontSize: "24px",
    color: "#38BDF8",
  },

  subtitle: {
    fontSize: "12px",
    color: "#94A3B8",
    marginBottom: "20px",
  },

  tableCard: {
    background: "#1E293B",
    padding: "15px",
    borderRadius: "12px",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "14px",
  },

  badge: {
    padding: "5px 10px",
    borderRadius: "20px",
    color: "#0F172A",
    fontSize: "12px",
  },

  actions: {
    display: "flex",
    gap: "10px",
  },

  approve: {
    background: "#22C55E",
    border: "none",
    padding: "6px 10px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
  },

  reject: {
    background: "#EF4444",
    border: "none",
    padding: "6px 10px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
  },

  loading: {
    color: "#E2E8F0",
    textAlign: "center",
    padding: "40px",
  },
};