import { Routes, Route, Navigate } from "react-router-dom";

/* AUTH */
import Login from "./modules/auth/Login";
import Register from "./modules/auth/Register";
import AdminLogin from "./modules/auth/AdminLogin";

/* ROUTE PROTECTION */
import ProtectedRoute from "./routes/ProtectedRoute";

/* LAYOUTS */
import StudentLayout from "./layouts/StudentLayout";
import AdminLayout from "./layouts/AdminLayout";

/* ================= STUDENT PAGES ================= */
import StudentDashboard from "./modules/student/StudentDashboard";
import HostelAllocation from "./modules/student/HostelAllocation";
import PaymentVerification from "./modules/student/PaymentVerification";
import Maintenance from "./modules/student/Maintenance";
import MyRoom from "./modules/student/MyRoom";   // ✅ ADDED

/* ================= ADMIN PAGES ================= */
import AdminDashboard from "./modules/admin/AdminDashboard";
import AdminStudents from "./modules/admin/AdminStudents";
import AdminHostels from "./modules/admin/AdminHostels";
import AdminRooms from "./modules/admin/AdminRooms";
import AdminPayments from "./modules/admin/AdminPayments";
import AdminMaintenance from "./modules/admin/AdminMaintenance";
import AdminAllocation from "./modules/admin/AdminAllocation";

function App() {
  return (
    <Routes>

      {/* DEFAULT */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* AUTH */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/admin-login" element={<AdminLogin />} />

      {/* ================= STUDENT ================= */}
      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRole="student">
            <StudentLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />

        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="hostel-allocation" element={<HostelAllocation />} />
        <Route path="my-room" element={<MyRoom />} />   {/* ✅ ADDED */}
        <Route path="payment-verification" element={<PaymentVerification />} />
        <Route path="maintenance" element={<Maintenance />} />
      </Route>

      {/* ================= ADMIN ================= */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRole="admin">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />

        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="students" element={<AdminStudents />} />
        <Route path="hostels" element={<AdminHostels />} />
        <Route path="rooms" element={<AdminRooms />} />
        <Route path="allocation" element={<AdminAllocation />} />
        <Route path="payments" element={<AdminPayments />} />
        <Route path="maintenance" element={<AdminMaintenance />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<Navigate to="/login" replace />} />

    </Routes>
  );
}

export default App;