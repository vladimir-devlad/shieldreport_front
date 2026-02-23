import { useNavigate, useLocation } from "react-router-dom";
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Box,
  IconButton,
  Tooltip,
  Divider,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import ShieldIcon from "@mui/icons-material/Shield";
import BarChartIcon from "@mui/icons-material/BarChart";
import GroupIcon from "@mui/icons-material/Group";
import BusinessIcon from "@mui/icons-material/Business";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useAuth } from "../../context/AuthContext";
import logo from "../../assets/logo.png";
import logoIcon from "../../assets/logo-icon.png";

const DRAWER_FULL = 240;
const DRAWER_COLLAPSED = 68;

const menuByRole = {
  superadmin: [
    { label: "Dashboard", path: "/dashboard", icon: <DashboardIcon /> },
    { label: "Usuarios", path: "/users", icon: <PeopleIcon /> },
    { label: "Roles", path: "/roles", icon: <ShieldIcon /> },
    { label: "Razón Social", path: "/razon-social", icon: <BusinessIcon /> },
    { label: "Reportes", path: "/reportes", icon: <BarChartIcon /> },
  ],
  admin: [
    { label: "Dashboard", path: "/dashboard", icon: <DashboardIcon /> },
    { label: "Usuarios", path: "/users", icon: <PeopleIcon /> },
    { label: "Supervisor", path: "/supervisor", icon: <GroupIcon /> },
    { label: "Reportes", path: "/reportes", icon: <BarChartIcon /> },
  ],
  supervisor: [
    { label: "Dashboard", path: "/dashboard", icon: <DashboardIcon /> },
    { label: "Mi Grupo", path: "/supervisor", icon: <GroupIcon /> },
    { label: "Reportes", path: "/reportes", icon: <BarChartIcon /> },
  ],
  usuario: [
    { label: "Dashboard", path: "/dashboard", icon: <DashboardIcon /> },
    { label: "Reportes", path: "/reportes", icon: <BarChartIcon /> },
  ],
};

export default function Sidebar({ collapsed, onToggle }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const navItems = menuByRole[user?.role] || menuByRole.usuario;

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: collapsed ? DRAWER_COLLAPSED : DRAWER_FULL,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: collapsed ? DRAWER_COLLAPSED : DRAWER_FULL,
          boxSizing: "border-box",
          bgcolor: "#ffffff",
          borderRight: "1px solid #e8eaf0",
          boxShadow: "2px 0 12px rgba(0,0,0,0.04)",
          overflowX: "hidden",
          transition: "width 0.3s ease",
        },
      }}
    >
      {/* Logo */}
      <Toolbar
        sx={{
          borderBottom: "1px solid #e8eaf0",
          justifyContent: "center",
          px: 2,
          minHeight: "64px !important",
        }}
      >
        <Box
          component="img"
          src={collapsed ? logoIcon : logo}
          alt="ShieldReports"
          sx={{
            height: collapsed ? 36 : 40,
            width: "auto",
            objectFit: "contain",
            transition: "all 0.3s ease",
          }}
        />
      </Toolbar>

      {/* Items del menú */}
      <List sx={{ flex: 1, px: 1, py: 1.5 }}>
        {navItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path !== "/dashboard" &&
              location.pathname.startsWith(item.path));

          return (
            <Tooltip
              key={item.path}
              title={collapsed ? item.label : ""}
              placement="right"
            >
              <ListItemButton
                onClick={() => navigate(item.path)}
                sx={{
                  mb: 0.5,
                  borderRadius: 2,
                  minHeight: 44,
                  justifyContent: collapsed ? "center" : "flex-start",
                  px: collapsed ? 1.5 : 2,
                  bgcolor: isActive ? "rgba(99,102,241,0.1)" : "transparent",
                  borderLeft: isActive
                    ? "3px solid #6366f1"
                    : "3px solid transparent",
                  "&:hover": {
                    bgcolor: "rgba(99,102,241,0.06)",
                    "& .MuiListItemIcon-root": { color: "#6366f1" },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActive ? "#6366f1" : "text.secondary",
                    minWidth: collapsed ? 0 : 36,
                    justifyContent: "center",
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                {!collapsed && (
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontSize: 14,
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? "text.primary" : "text.secondary",
                    }}
                  />
                )}
              </ListItemButton>
            </Tooltip>
          );
        })}
      </List>

      <Divider />

      {/* Botón colapsar */}
      <Box sx={{ p: 1 }}>
        <Tooltip title={collapsed ? "Expandir" : "Colapsar"} placement="right">
          <IconButton
            onClick={onToggle}
            sx={{
              width: "100%",
              borderRadius: 2,
              border: "1px solid #e8eaf0",
              "&:hover": {
                bgcolor: "rgba(99,102,241,0.06)",
                color: "primary.main",
                borderColor: "rgba(99,102,241,0.3)",
              },
            }}
          >
            {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        </Tooltip>
      </Box>
    </Drawer>
  );
}
