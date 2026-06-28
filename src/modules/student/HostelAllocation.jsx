import { useEffect, useState, useRef } from "react";
import { auth, db } from "../../config/firebase";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  where,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";

function HostelAllocation() {
  const [studentProfile, setStudentProfile] = useState(null);
  const [hostels, setHostels] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [activeReservation, setActiveReservation] = useState(null);
  const [selectedHostel, setSelectedHostel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reserving, setReserving] = useState(false);
  const [timerText, setTimerText] = useState("");

  const navigate = useNavigate();
  const timerIntervalRef = useRef(null);

  // FETCH STUDENT PROFILE & GENDER MATCHING HOSTELS
  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        navigate("/login");
        return;
      }

      // Fetch Profile
      const profileSnap = await getDoc(doc(db, "users", user.uid));
      if (!profileSnap.exists()) {
        alert("Student profile not found.");
        return;
      }
      const profile = { id: profileSnap.id, ...profileSnap.data() };
      setStudentProfile(profile);

      if (profile.roomAssigned) {
        alert("You already have an allocated room.");
        navigate("/student/my-room");
        return;
      }

      // Fetch Hostels matching student gender
      const hostelSnap = await getDocs(
        query(collection(db, "hostels"), where("gender", "==", profile.gender || "Male"))
      );
      setHostels(hostelSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      // Fetch Active Reservation for this student
      const resSnap = await getDoc(doc(db, "reservations", user.uid));
      if (resSnap.exists()) {
        const resData = resSnap.data();
        if (new Date(resData.expiresAt) > new Date()) {
          // Resolve hostel and room details
          const hSnap = await getDoc(doc(db, "hostels", resData.hostelId));
          const rSnap = await getDoc(doc(db, "rooms", resData.roomId));
          setActiveReservation({
            ...resData,
            hostelName: hSnap.exists() ? hSnap.data().hostelName : "Unknown Hostel",
            roomNumber: rSnap.exists() ? rSnap.data().roomNumber : "Unknown Room",
          });
        } else {
          // Clean up expired reservation
          await deleteDoc(doc(db, "reservations", user.uid));
        }
      }
    } catch (err) {
      console.log("Error loading selection data:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchInitialData();
    return () => clearInterval(timerIntervalRef.current);
  }, []);

  // LOAD ROOMS & ACTIVE RESERVATIONS FOR SELECTED HOSTEL
  const loadHostelDetails = async (hostelId) => {
    const hostel = hostels.find(h => h.id === hostelId);
    setSelectedHostel(hostel);
    setRooms([]);

    try {
      // Get all rooms in this hostel
      const roomSnap = await getDocs(
        query(collection(db, "rooms"), where("hostelId", "==", hostelId))
      );
      const roomsData = roomSnap.docs.map(d => ({
        id: d.id,
        occupants: [],
        ...d.data(),
      }));

      // Get all active reservations in the system to calculate vacant space
      const resSnap = await getDocs(collection(db, "reservations"));
      const activeRes = resSnap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(r => new Date(r.expiresAt) > new Date());

      setReservations(activeRes);
      setRooms(roomsData.sort((a, b) => a.roomNumber.localeCompare(b.roomNumber)));
    } catch (err) {
      console.log("Error loading rooms:", err);
    }
  };

  // HANDLE RESERVATION TIMER
  useEffect(() => {
    if (activeReservation) {
      clearInterval(timerIntervalRef.current);
      const targetTime = new Date(activeReservation.expiresAt).getTime();

      const updateTimer = () => {
        const now = new Date().getTime();
        const diff = targetTime - now;

        if (diff <= 0) {
          clearInterval(timerIntervalRef.current);
          setTimerText("Expired!");
          setActiveReservation(null);
          // Delete expired from DB
          const user = auth.currentUser;
          if (user) {
            deleteDoc(doc(db, "reservations", user.uid)).then(() => {
              fetchInitialData();
            });
          }
        } else {
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          setTimerText(`${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`);
        }
      };

      updateTimer();
      timerIntervalRef.current = setInterval(updateTimer, 1000);
    } else {
      clearInterval(timerIntervalRef.current);
      setTimerText("");
    }
    return () => clearInterval(timerIntervalRef.current);
  }, [activeReservation]);

  // CANCEL RESERVATION MANUALLY
  const handleCancelReservation = async () => {
    const confirmCancel = window.confirm("Are you sure you want to cancel your current room reservation?");
    if (!confirmCancel) return;

    setLoading(true);
    try {
      const user = auth.currentUser;
      if (user) {
        await deleteDoc(doc(db, "reservations", user.uid));
        setActiveReservation(null);
        alert("Reservation cancelled successfully.");
        await fetchInitialData();
        if (selectedHostel) {
          await loadHostelDetails(selectedHostel.id);
        }
      }
    } catch (err) {
      console.log(err);
    }
    setLoading(false);
  };

  // CREATE RESERVATION
  const handleReserve = async (room) => {
    if (activeReservation) {
      alert("You already have an active room reservation. Cancel it first to choose a different room.");
      return;
    }

    // Double check availability
    const occupied = room.occupants?.length || 0;
    const reservedByOthers = reservations.filter(
      r => r.roomId === room.id && r.studentId !== studentProfile.id
    ).length;
    const vacant = room.capacity - occupied - reservedByOthers;

    if (vacant <= 0) {
      alert("No vacant space remaining in this room. Please select another room.");
      return;
    }

    setReserving(true);
    try {
      const user = auth.currentUser;
      if (!user) return;

      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

      await setDoc(doc(db, "reservations", user.uid), {
        studentId: user.uid,
        roomId: room.id,
        hostelId: room.hostelId,
        expiresAt,
        status: "reserved",
        createdAt: new Date().toISOString(),
      });

      alert(`Space in Room ${room.roomNumber} reserved for 15 minutes! Proceed to payment to secure it.`);
      await fetchInitialData();
      navigate("/student/payment-verification");
    } catch (err) {
      console.log(err);
      alert("Failed to hold room space.");
    }
    setReserving(false);
  };

  if (loading) {
    return <div style={styles.loading}>Loading hostels...</div>;
  }

  return (
    <div style={styles.container}>
      <style>{`
        .hostel-card {
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        .hostel-card:hover {
          transform: translateY(-4px);
          border-color: rgba(56, 189, 248, 0.3) !important;
          box-shadow: 0 10px 25px rgba(14, 165, 233, 0.15) !important;
        }
        .room-row {
          transition: background-color 0.2s ease !important;
        }
        .room-row:hover {
          background-color: rgba(255, 255, 255, 0.02) !important;
        }
        .reserve-btn {
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        .reserve-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          filter: brightness(1.1);
        }
        .reserve-btn:active:not(:disabled) {
          transform: translateY(1px);
        }
        .pay-btn {
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        .pay-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3) !important;
          filter: brightness(1.05);
        }
      `}</style>

      {/* HEADER */}
      <h1 style={styles.title}>Hostel & Room Selection</h1>
      <p style={styles.subtitle}>
        Select a hostel and reserve an available room space before completing payment
      </p>

      {/* ACTIVE RESERVATION ALERT */}
      {activeReservation && (
        <div style={styles.reservationBanner}>
          <div style={{ fontSize: "28px" }}>⏳</div>
          <div style={{ flex: 1, minWidth: "220px" }}>
            <h4 style={styles.bannerTitle}>Active Space Hold Details</h4>
            <p style={styles.bannerText}>
              You have temporarily held space in <strong>Room {activeReservation.roomNumber}</strong> (Hostel: {activeReservation.hostelName}). Complete your payment submission before the timer runs out to avoid releasing the space.
            </p>
            <div style={{ marginTop: "12px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button
                onClick={() => navigate("/student/payment-verification")}
                className="pay-btn"
                style={styles.payBtn}
              >
                Proceed to Payment Verification 💳
              </button>
              <button
                onClick={handleCancelReservation}
                style={styles.cancelBtn}
              >
                Release Space
              </button>
            </div>
          </div>
          <div style={styles.timerBox}>
            <span style={{ fontSize: "11px", color: "#FBBF24", fontWeight: "600", textTransform: "uppercase" }}>Time Remaining</span>
            <span style={styles.timerVal}>{timerText}</span>
          </div>
        </div>
      )}

      {/* HOSTELS GRID */}
      <h3 style={styles.sectionTitle}>Available Hostels ({studentProfile?.gender} Category)</h3>
      <div className="responsive-grid-3" style={styles.grid}>
        {hostels.map((h) => (
          <div
            key={h.id}
            onClick={() => loadHostelDetails(h.id)}
            className="hostel-card"
            style={{
              ...styles.card,
              borderColor: selectedHostel?.id === h.id ? "#38BDF8" : "rgba(255,255,255,0.04)",
              background: selectedHostel?.id === h.id ? "rgba(30, 41, 59, 0.7)" : "rgba(30, 41, 59, 0.4)",
            }}
          >
            <h3 style={styles.hostelName}>{h.hostelName}</h3>
            <p style={styles.price}>₦{Number(h.hostelPrice)?.toLocaleString()}</p>
            <div style={styles.metaRow}>
              <span style={styles.metaLabel}>Capacity:</span>
              <span style={styles.metaVal}>{h.roomCapacity}-Man Rooms</span>
            </div>
            <div style={styles.metaRow}>
              <span style={styles.metaLabel}>Total Rooms:</span>
              <span style={styles.metaVal}>{h.totalRooms} Rooms</span>
            </div>
          </div>
        ))}
      </div>

      {/* ROOMS TABLE */}
      {selectedHostel && (
        <div style={styles.roomsSection}>
          <h3 style={styles.sectionTitle}>
            Rooms in {selectedHostel.hostelName} (Real-time Occupancy)
          </h3>
          <p style={styles.sectionSubtitle}>
            Select a room with vacant spaces. The space will be reserved for you for 15 minutes.
          </p>

          <div className="table-wrapper">
            <table style={styles.table}>
              <thead>
                <tr style={styles.trHead}>
                  <th style={styles.th}>Room Number</th>
                  <th style={styles.th}>Capacity</th>
                  <th style={styles.th}>Occupied Spaces</th>
                  <th style={styles.th}>Reserved Holds</th>
                  <th style={styles.th}>Vacant Spaces</th>
                  <th style={styles.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((room) => {
                  const occupied = room.occupants?.length || 0;
                  const isReservedByMe = activeReservation?.roomId === room.id;
                  
                  // Filter out active reservations on this room by others
                  const reservedByOthers = reservations.filter(
                    r => r.roomId === room.id && r.studentId !== studentProfile?.id
                  ).length;

                  const vacant = room.capacity - occupied - reservedByOthers;

                  return (
                    <tr key={room.id} className="room-row" style={styles.tr}>
                      <td style={{ ...styles.td, fontWeight: "700", color: "#F8FAFC" }}>
                        Room {room.roomNumber}
                      </td>
                      <td style={styles.td}>{room.capacity}-Man</td>
                      <td style={styles.td}>{occupied} Bedspaces</td>
                      <td style={styles.td}>
                        {reservedByOthers > 0 && (
                          <span style={{ color: "#FBBF24", fontWeight: "600" }}>
                            {reservedByOthers} Hold(s)
                          </span>
                        )}
                        {reservedByOthers === 0 && <span style={{ color: "#64748B" }}>0 Holds</span>}
                      </td>
                      <td style={styles.td}>
                        <span style={{
                          fontWeight: "700",
                          color: vacant <= 0 ? "#EF4444" : vacant === 1 ? "#F59E0B" : "#10B981"
                        }}>
                          {vacant <= 0 ? "Full" : `${vacant} Vacant`}
                        </span>
                      </td>
                      <td style={styles.td}>
                        {isReservedByMe ? (
                          <span style={styles.myResBadge}>Reserved by You</span>
                        ) : (
                          <button
                            onClick={() => handleReserve(room)}
                            disabled={vacant <= 0 || reserving || !!activeReservation}
                            className="reserve-btn"
                            style={{
                              ...styles.reserveBtn,
                              background: vacant <= 0 ? "#475569" : "linear-gradient(135deg,#38BDF8,#0EA5E9)",
                              cursor: (vacant <= 0 || reserving || !!activeReservation) ? "not-allowed" : "pointer",
                              opacity: (vacant <= 0 || !!activeReservation) ? 0.6 : 1,
                            }}
                          >
                            {vacant <= 0 ? "Room Full" : "Reserve Space"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default HostelAllocation;

/* ================= STYLES ================= */

const styles = {
  container: {
    color: "#E2E8F0",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  title: {
    fontSize: "28px",
    color: "#38BDF8",
    margin: 0,
    fontFamily: "'Outfit', sans-serif",
  },
  subtitle: {
    fontSize: "14px",
    color: "#64748B",
    margin: "5px 0 25px 0",
  },
  reservationBanner: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
    background: "rgba(245, 158, 11, 0.08)",
    border: "1px solid rgba(245, 158, 11, 0.25)",
    padding: "20px 24px",
    borderRadius: "16px",
    marginBottom: "30px",
    flexWrap: "wrap",
  },
  bannerTitle: {
    margin: 0,
    fontSize: "16px",
    color: "#FBBF24",
    fontWeight: "700",
    fontFamily: "'Outfit', sans-serif",
  },
  bannerText: {
    margin: "5px 0 0 0",
    fontSize: "13.5px",
    color: "#94A3B8",
    lineHeight: "1.5",
  },
  payBtn: {
    padding: "10px 18px",
    background: "linear-gradient(135deg, #10B981, #059669)",
    border: "none",
    borderRadius: "8px",
    color: "#FFFFFF",
    fontWeight: "700",
    cursor: "pointer",
    fontSize: "12.5px",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  cancelBtn: {
    padding: "10px 18px",
    background: "rgba(239, 68, 68, 0.15)",
    border: "1px solid rgba(239, 68, 68, 0.25)",
    borderRadius: "8px",
    color: "#F87171",
    fontWeight: "700",
    cursor: "pointer",
    fontSize: "12.5px",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  timerBox: {
    background: "rgba(0, 0, 0, 0.3)",
    border: "1px solid rgba(245, 158, 11, 0.15)",
    padding: "10px 20px",
    borderRadius: "12px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "100px",
  },
  timerVal: {
    fontSize: "24px",
    fontWeight: "800",
    color: "#FBBF24",
    fontFamily: "monospace",
    marginTop: "2px",
  },
  sectionTitle: {
    margin: "0 0 15px 0",
    color: "#E2E8F0",
    fontSize: "18px",
    fontWeight: "700",
    fontFamily: "'Outfit', sans-serif",
  },
  grid: {
    marginBottom: "30px",
  },
  card: {
    padding: "20px",
    borderRadius: "16px",
    border: "1px solid",
    cursor: "pointer",
    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)",
  },
  hostelName: {
    margin: 0,
    fontSize: "17px",
    color: "#F8FAFC",
    fontWeight: "700",
    fontFamily: "'Outfit', sans-serif",
  },
  price: {
    fontSize: "15px",
    color: "#F59E0B",
    fontWeight: "700",
    margin: "8px 0 12px 0",
    fontFamily: "'Outfit', sans-serif",
  },
  metaRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "13px",
    marginTop: "6px",
  },
  metaLabel: {
    color: "#64748B",
  },
  metaVal: {
    color: "#E2E8F0",
    fontWeight: "600",
  },
  roomsSection: {
    background: "rgba(20, 26, 46, 0.4)",
    padding: "25px 20px",
    borderRadius: "20px",
    border: "1px solid rgba(255, 255, 255, 0.04)",
    marginTop: "10px",
  },
  sectionSubtitle: {
    margin: "-8px 0 20px 0",
    fontSize: "13.5px",
    color: "#64748B",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "14px",
    textAlign: "left",
  },
  trHead: {
    borderBottom: "2px solid rgba(255, 255, 255, 0.08)",
  },
  tr: {
    borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
  },
  th: {
    padding: "12px 16px",
    color: "#94A3B8",
    fontWeight: "600",
    fontSize: "13px",
  },
  td: {
    padding: "16px",
    color: "#E2E8F0",
    whiteSpace: "nowrap",
  },
  reserveBtn: {
    border: "none",
    padding: "8px 16px",
    borderRadius: "8px",
    color: "#0F172A",
    fontWeight: "700",
    fontSize: "13px",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  myResBadge: {
    background: "rgba(16, 185, 129, 0.15)",
    border: "1px solid rgba(16, 185, 129, 0.25)",
    color: "#34D399",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "700",
    display: "inline-block",
  },
  loading: {
    color: "#E2E8F0",
    textAlign: "center",
    padding: "60px",
    fontSize: "16px",
  },
};