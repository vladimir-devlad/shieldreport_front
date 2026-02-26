import {
  BarChart,
  Business,
  Dashboard,
  Group,
  People,
  Person,
} from "@mui/icons-material";
import { BottomNavigation, BottomNavigationAction, Paper } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const navByRole = {
  superadmin: [
    { label: "Inicio", path: "/dashboard", icon: <Dashboard /> },
    { label: "Usuarios", path: "/users", icon: <People /> },
    { label: "Supervisor", path: "/supervisor", icon: <Group /> },
    { label: "RS", path: "/razon-social", icon: <Business /> },
    { label: "Reportes", path: "/reportes", icon: <BarChart /> },
  ],
  admin: [
    { label: "Inicio", path: "/dashboard", icon: <Dashboard /> },
    { label: "Usuarios", path: "/users", icon: <People /> },
    { label: "Supervisor", path: "/supervisor", icon: <Group /> },
    { label: "RS", path: "/razon-social", icon: <Business /> },
    { label: "Reportes", path: "/reportes", icon: <BarChart /> },
  ],
  supervisor: [
    { label: "Inicio", path: "/dashboard", icon: <Dashboard /> },
    { label: "Mi Grupo", path: "/supervisor", icon: <Group /> },
    { label: "RS", path: "/razon-social", icon: <Business /> },
    { label: "Reportes", path: "/reportes", icon: <BarChart /> },
    { label: "Perfil", path: "/profile", icon: <Person /> },
  ],
  usuario: [
    { label: "Inicio", path: "/dashboard", icon: <Dashboard /> },
    { label: "Reportes", path: "/reportes", icon: <BarChart /> },
    { label: "Perfil", path: "/profile", icon: <Person /> },
  ],
};

export default function BottomNav() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const role = user?.role?.toLowerCase() ?? "usuario";
  const items = navByRole[role] ?? navByRole.usuario;

  const currentIndex = items.findIndex(
    (item) => pathname === item.path || pathname.startsWith(item.path + "/"),
  );

  return (
    <Paper
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1200,
        borderTop: "1px solid #e2e8f0",
        boxShadow: "0 -4px 20px rgba(0,0,0,0.08)",
      }}
      elevation={0}
    >
      <BottomNavigation
        value={currentIndex === -1 ? 0 : currentIndex}
        onChange={(_, newIndex) => navigate(items[newIndex].path)}
        sx={{
          height: 64,
          "& .MuiBottomNavigationAction-root": {
            color: "#9ca3af",
            minWidth: 0,
            fontSize: "0.65rem",
            "&.Mui-selected": {
              color: "#6366f1",
            },
          },
          "& .MuiBottomNavigationAction-label": {
            fontSize: "0.65rem !important",
            fontWeight: 600,
          },
        }}
      >
        {items.map((item) => (
          <BottomNavigationAction
            key={item.path}
            label={item.label}
            icon={item.icon}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
}
