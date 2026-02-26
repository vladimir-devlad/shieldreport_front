import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Layout from "../components/layout/Layout";
import { useAuth } from "../context/AuthContext";
import LoginPage from "../pages/auth/LoginPage";
import DashboardPage from "../pages/dashboard/DashboardPage";
import ProfilePage from "../pages/profile/ProfilePage";
import AsignarRazonSocialPage from "../pages/razon-social/AsignarRazonSocialPage";
import RazonSocialPage from "../pages/razon-social/RazonSocialPage";
import ReportesPage from "../pages/reportes/ReportesPage";
import SupervisorPage from "../pages/supervisor/SupervisorPage";
import UsersPage from "../pages/users/UsersPage";

const PrivateRoute = ({ children }) => {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" />;
};

const AppRouter = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="reportes" element={<ReportesPage />} />
        <Route path="razon-social" element={<RazonSocialPage />} />
        <Route
          path="razon-social/asignar"
          element={<AsignarRazonSocialPage />}
        />
        <Route path="supervisor" element={<SupervisorPage />} />
        <Route path="profile" element={<ProfilePage />} />
        {/* Aquí irán las demás páginas */}
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  </BrowserRouter>
);

export default AppRouter;
