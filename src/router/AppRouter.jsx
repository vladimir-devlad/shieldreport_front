import { Box, CircularProgress } from "@mui/material";
import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Layout from "../components/layout/Layout";
import { useAuth } from "../context/AuthContext";

// ── Lazy imports ─────────────────────────────────
const LoginPage = lazy(() => import("../pages/auth/LoginPage"));
const DashboardPage = lazy(() => import("../pages/dashboard/DashboardPage"));
const UsersPage = lazy(() => import("../pages/users/UsersPage"));
const SupervisorPage = lazy(() => import("../pages/supervisor/SupervisorPage"));
const RazonSocialPage = lazy(
  () => import("../pages/razon-social/RazonSocialPage"),
);
const AsignarRazonSocialPage = lazy(
  () => import("../pages/razon-social/AsignarRazonSocialPage"),
);
const ReportesPage = lazy(() => import("../pages/reportes/ReportesPage"));
const ProfilePage = lazy(() => import("../pages/profile/ProfilePage"));
const UserDetailPage = lazy(() => import("../pages/users/UserDetailPage"));
const UserEditPage = lazy(() => import("../pages/users/UserEditPage"));

// ── Fallback de carga ─────────────────────────────
const PageLoader = () => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "60vh",
    }}
  >
    <CircularProgress sx={{ color: "#6366f1" }} />
  </Box>
);

const PrivateRoute = ({ children }) => {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" />;
};

const AppRouter = () => (
  <BrowserRouter>
    <Suspense fallback={<PageLoader />}>
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
          <Route path="users/:id" element={<UserDetailPage />} />{" "}
          <Route path="users/:id/edit" element={<UserEditPage />} />{" "}
          <Route path="reportes" element={<ReportesPage />} />
          <Route path="razon-social" element={<RazonSocialPage />} />
          <Route
            path="razon-social/asignar"
            element={<AsignarRazonSocialPage />}
          />
          <Route path="supervisor" element={<SupervisorPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  </BrowserRouter>
);

export default AppRouter;
