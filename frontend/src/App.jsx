import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

import AdminDashboard from "./pages/admin/AdminDashboard";
import TeamDashboard from "./pages/team/TeamDashboard";
import EventDetails from "./pages/admin/EventDetails";

import GalleryAccess from "./pages/customer/GalleryAccess";
import CustomerGallery from "./pages/customer/CustomerGallery";

import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Home */}
        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />

        {/* Authentication */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Admin */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

<Route
          path="/admin/events/:eventId"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <EventDetails />
            </ProtectedRoute>
          }
        />

        {/* Team Member */}
        <Route
          path="/team"
          element={
            <ProtectedRoute allowedRoles={["TEAM_MEMBER"]}>
              <TeamDashboard />
            </ProtectedRoute>
          }
        />

        {/* Customer Gallery */}
        <Route path="/gallery/:shareToken" element={<GalleryAccess />} />
        <Route
          path="/gallery/:shareToken/photos"
          element={<CustomerGallery />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;