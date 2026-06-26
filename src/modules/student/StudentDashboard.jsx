import { useEffect, useState } from "react";
import { auth, db } from "../../config/firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

function StudentDashboard() {
  const [userData, setUserData] = useState(null);
  const [hostels, setHostels] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const user = auth.currentUser;

        if (!user) {
          navigate("/login");
          return;
        }

        // Fetch User Data
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const uData = docSnap.data();
          setUserData(uData);

          // Fetch Hostels matching user's gender
          if (uData.gender) {
            const hQuery = query(
              collection(db, "hostels"),
              where("gender", "==", uData.gender)
            );
            const hSnap = await getDocs(hQuery);
            setHostels(hSnap.docs.map(d => ({ id: d.id, ...d.data() })));
          }

          // Fetch User's Payments
          const pQuery = query(
            collection(db, "payments"),
            where("studentId", "==", user.uid)
          );
          const pSnap = await getDocs(pQuery);
          setPayments(pSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        }
      } catch (error) {
        console.log(error.message);
      }

      setLoading(false);
    };

    fetchDashboardData();
  }, [navigate]);

  if (loading) {
    return <div style={styles.loading}>Loading dashboard...</div>;
  }

  const isAllocated = userData?.roomAssigned;
  const paymentVerified = userData?.paymentStatus === "verified";
  
  const hasPendingPayment = payments.some(p => p.status === "pending");

  return (
    <div style={styles.container}>
      <style>{`
        .dashboard-card {
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        .dashboard-card:hover {
          transform: translateY(-4px);
          border-color: rgba(255, 255, 255, 0.1) !important;
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.3) !important;
          background: rgba(30, 41, 59, 0.6) !important;
        }
        .hostel-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        .hostel-card:hover {
          transform: translateY(-5px);
          border-color: rgba(56, 189, 248, 0.35) !important;
          box-shadow: 0 15px 35px rgba(14, 165, 233, 0.15) !important;
        }
        .cta-btn {
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        .cta-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 24px rgba(244, 180, 0, 0.4) !important;
          filter: brightness(1.05);
        }
        .cta-btn:active {
          transform: translateY(1px);
        }
        .banner-btn {
          transition: all 0.2s ease !important;
        }
        .banner-btn:hover {
          filter: brightness(1.1);
          transform: scale(1.03);
        }
      `}</style>

      {/* WELCOME HEADER */}
      <div style={styles.header}>
        <h1 style={styles.welcome}>Welcome, {userData?.fullName} 👋</h1>
        <p style={styles.subText}>Student Hostel Portal & Dashboard</p>
      </div>

      {/* ALLOCATION STATE BANNER */}
      {isAllocated ? (
        <div style={styles.successBanner}>
          <div style={{ fontSize: "24px" }}>🎉</div>
          <div style={{ flex: 1 }}>
            <h4 style={styles.bannerTitle}>Hostel Room Allocated!</h4>
            <p style={styles.bannerText}>
              You have been successfully assigned to Room {userData.roomId}. Head over to the "My Room" section to view details.
            </p>
          </div>
          <button onClick={() => navigate("/student/my-room")} className="banner-btn" style={styles.bannerBtn}>
            View Room
          </button>
        </div>
      ) : paymentVerified ? (
        <div style={styles.infoBanner}>
          <div style={{ fontSize: "24px" }}>⚡</div>
          <div style={{ flex: 1 }}>
            <h4 style={styles.bannerTitle}>Payment Verified! Allocation Pending</h4>
            <p style={styles.bannerText}>
              Your hostel payment has been verified by the administrator. You are currently queued in the Smart Allocation engine.
            </p>
          </div>
        </div>
      ) : hasPendingPayment ? (
        <div style={styles.warningBanner}>
          <div style={{ fontSize: "24px" }}>⏳</div>
          <div style={{ flex: 1 }}>
            <h4 style={styles.bannerTitle}>Payment Review In Progress</h4>
            <p style={styles.bannerText}>
              Your payment submission is currently undergoing review. Once verified, room allocation will begin automatically.
            </p>
          </div>
        </div>
      ) : (
        <div style={styles.dangerBanner}>
          <div style={{ fontSize: "24px" }}>💳</div>
          <div style={{ flex: 1 }}>
            <h4 style={styles.bannerTitle}>Payment Required for Allocation</h4>
            <p style={styles.bannerText}>
              You must verify payment before being allocated a hostel room. Please check the available hostels below and pay your fee.
            </p>
          </div>
          <button onClick={() => navigate("/student/payment-verification")} className="banner-btn" style={styles.bannerBtnDanger}>
            Pay Now
          </button>
        </div>
      )}

      {/* DASHBOARD CARDS GRID */}
      <div style={styles.cardGrid}>
        <div className="dashboard-card" style={styles.card}>
          <h3 style={styles.cardTitle}>Matric Number</h3>
          <p style={styles.cardValue}>{userData?.matricNo}</p>
        </div>

        <div className="dashboard-card" style={styles.card}>
          <h3 style={styles.cardTitle}>Registered Gender</h3>
          <p style={styles.cardValue}>{userData?.gender || "Not Set"}</p>
        </div>

        <div className="dashboard-card" style={styles.card}>
          <h3 style={styles.cardTitle}>Course of Study</h3>
          <p style={styles.cardValue}>{userData?.courseOfStudy || "Not Set"}</p>
        </div>

        <div className="dashboard-card" style={styles.card}>
          <h3 style={styles.cardTitle}>Level</h3>
          <p style={styles.cardValue}>{userData?.level ? `${userData.level} Level` : "Not Set"}</p>
        </div>
      </div>

      {/* AVAILABLE HOSTELS SECTION - BEFORE CONTINUOUS ALLOCATION */}
      {!isAllocated && (
        <div style={styles.hostelsSection}>
          <h2 style={styles.sectionTitle}>Available {userData?.gender} Hostels & Fees</h2>
          <p style={styles.sectionSubtitle}>Select and make payment for your preferred category to secure your bed space.</p>

          <div style={styles.hostelsGrid}>
            {hostels.length === 0 ? (
              <p style={styles.noHostels}>No hostels available matching your gender category at this moment.</p>
            ) : (
              hostels.map(hostel => (
                <div key={hostel.id} className="hostel-card" style={styles.hostelCard}>
                  <div style={styles.hostelHeader}>
                    <h3 style={styles.hostelName}>{hostel.hostelName}</h3>
                    <span style={styles.priceTag}>₦{hostel.hostelPrice?.toLocaleString()}</span>
                  </div>
                  <div style={styles.hostelBody}>
                    <div style={styles.hostelMetaItem}>
                      <span style={styles.metaLabel}>Capacity Per Room:</span>
                      <span style={styles.metaValue}>{hostel.roomCapacity}-Man Rooms</span>
                    </div>
                    <div style={styles.hostelMetaItem}>
                      <span style={styles.metaLabel}>Total Rooms:</span>
                      <span style={styles.metaValue}>{hostel.totalRooms} Rooms</span>
                    </div>
                    <div style={styles.hostelMetaItem}>
                      <span style={styles.metaLabel}>Suitable Gender:</span>
                      <span style={styles.metaValue}>{hostel.gender}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {!paymentVerified && !hasPendingPayment && (
            <div style={styles.ctaBox}>
              <p style={styles.ctaText}>
                Have you already made the payment for your preferred hostel? Proceed to submit your payment receipt reference.
              </p>
              <button onClick={() => navigate("/student/payment-verification")} className="cta-btn" style={styles.ctaButton}>
                Submit Payment Reference 💳
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default StudentDashboard;

const styles = {
  container: {
    color: "#E2E8F0",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  header: {
    marginBottom: "25px",
  },
  welcome: {
    fontSize: "30px",
    fontWeight: "700",
    color: "#F8FAFC",
    margin: 0,
    fontFamily: "'Outfit', sans-serif",
  },
  subText: {
    color: "#64748B",
    fontSize: "14.5px",
    margin: "6px 0 0 0",
  },
  successBanner: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    background: "rgba(16, 185, 129, 0.12)",
    border: "1px solid rgba(16, 185, 129, 0.25)",
    borderRadius: "16px",
    padding: "16px 20px",
    color: "#34D399",
    marginBottom: "30px",
  },
  infoBanner: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    background: "rgba(56, 189, 248, 0.12)",
    border: "1px solid rgba(56, 189, 248, 0.25)",
    borderRadius: "16px",
    padding: "16px 20px",
    color: "#38BDF8",
    marginBottom: "30px",
  },
  warningBanner: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    background: "rgba(245, 158, 11, 0.12)",
    border: "1px solid rgba(245, 158, 11, 0.25)",
    borderRadius: "16px",
    padding: "16px 20px",
    color: "#FBBF24",
    marginBottom: "30px",
  },
  dangerBanner: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    background: "rgba(239, 68, 68, 0.1)",
    border: "1px solid rgba(239, 68, 68, 0.2)",
    borderRadius: "16px",
    padding: "16px 20px",
    color: "#F87171",
    marginBottom: "30px",
  },
  bannerTitle: {
    margin: 0,
    fontSize: "15.5px",
    fontWeight: "700",
    fontFamily: "'Outfit', sans-serif",
  },
  bannerText: {
    margin: "4px 0 0 0",
    fontSize: "13px",
    opacity: 0.85,
    lineHeight: "1.4",
  },
  bannerBtn: {
    padding: "8px 16px",
    background: "#10B981",
    border: "none",
    borderRadius: "8px",
    color: "#0F172A",
    fontWeight: "700",
    cursor: "pointer",
    fontSize: "13px",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  bannerBtnDanger: {
    padding: "8px 16px",
    background: "#EF4444",
    border: "none",
    borderRadius: "8px",
    color: "#FFFFFF",
    fontWeight: "700",
    cursor: "pointer",
    fontSize: "13px",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  cardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "20px",
    marginBottom: "40px",
  },
  card: {
    background: "rgba(30, 41, 59, 0.45)",
    padding: "24px 20px",
    borderRadius: "16px",
    border: "1px solid rgba(255, 255, 255, 0.04)",
  },
  cardTitle: {
    margin: 0,
    fontSize: "11.5px",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: "1px",
    fontWeight: "600",
  },
  cardValue: {
    margin: "10px 0 0 0",
    fontSize: "19px",
    fontWeight: "700",
    color: "#F8FAFC",
    fontFamily: "'Outfit', sans-serif",
  },
  hostelsSection: {
    background: "rgba(15, 23, 42, 0.3)",
    border: "1px solid rgba(255, 255, 255, 0.03)",
    padding: "30px",
    borderRadius: "20px",
    marginBottom: "30px",
  },
  sectionTitle: {
    margin: 0,
    fontSize: "22px",
    color: "#38BDF8",
    fontWeight: "700",
    fontFamily: "'Outfit', sans-serif",
  },
  sectionSubtitle: {
    margin: "6px 0 24px 0",
    fontSize: "13.5px",
    color: "#64748B",
  },
  hostelsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "20px",
    marginBottom: "30px",
  },
  hostelCard: {
    background: "rgba(30, 41, 59, 0.5)",
    border: "1px solid rgba(255, 255, 255, 0.05)",
    borderRadius: "16px",
    padding: "24px 20px",
    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
  },
  hostelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
    paddingBottom: "14px",
    marginBottom: "14px",
  },
  hostelName: {
    margin: 0,
    fontSize: "18px",
    color: "#F1F5F9",
    fontWeight: "600",
    fontFamily: "'Outfit', sans-serif",
  },
  priceTag: {
    background: "rgba(244, 180, 0, 0.12)",
    color: "#F59E0B",
    fontWeight: "700",
    padding: "5px 12px",
    borderRadius: "20px",
    fontSize: "13.5px",
    fontFamily: "'Outfit', sans-serif",
    border: "1px solid rgba(244, 180, 0, 0.15)",
  },
  hostelBody: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  hostelMetaItem: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "13.5px",
  },
  metaLabel: {
    color: "#64748B",
  },
  metaValue: {
    color: "#E2E8F0",
    fontWeight: "600",
  },
  noHostels: {
    color: "#64748B",
    fontSize: "14px",
    fontStyle: "italic",
  },
  ctaBox: {
    borderTop: "1px solid rgba(255, 255, 255, 0.05)",
    paddingTop: "24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "20px",
  },
  ctaText: {
    margin: 0,
    fontSize: "13.5px",
    color: "#94A3B8",
    maxWidth: "500px",
    lineHeight: "1.5",
  },
  ctaButton: {
    padding: "13px 26px",
    background: "linear-gradient(135deg, #F4B400, #D97706)",
    color: "#0F172A",
    fontWeight: "700",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    fontSize: "14px",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    boxShadow: "0 6px 20px rgba(244, 180, 0, 0.15)",
  },
  loading: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "60vh",
    color: "#E2E8F0",
    fontSize: "18px",
  },
};