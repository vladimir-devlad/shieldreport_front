import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoginPage from "../pages/auth/LoginPage";
import Layout from "../components/layout/Layout";
import DashboardPage from "../pages/dashboard/DashboardPage";
import UsersPage from "../pages/users/UsersPage";
import ReportesPage from "../pages/reportes/ReportesPage";
import RazonSocialPage from "../pages/razon-social/RazonSocialPage";
import AsignarRazonSocialPage from "../pages/razon-social/AsignarRazonSocialPage";

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
          path="razon-social/:id/asignar"
          element={<AsignarRazonSocialPage />}
        />
        {/* Aquí irán las demás páginas */}
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  </BrowserRouter>
);

export default AppRouter;
