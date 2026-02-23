import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
  InputBase,
  Badge,
  Popover,
  List,
  ListItem,
  ListItemText,
  Divider,
} from "@mui/material";
import { Logout, Search, Notifications, Circle } from "@mui/icons-material";
import { useAuth } from "../../context/AuthContext";

const ROLE_LABELS = {
  superadmin: "Super Admin",
  admin: "Administrador",
  supervisor: "Supervisor",
  usuario: "Usuario",
};

const ROLE_COLORS = {
  superadmin: "error",
  admin: "warning",
  supervisor: "info",
  usuario: "default",
};

// Mapa de rutas → títulos
const PAGE_TITLES = {
  "/": "Dashboard",
  "/users": "Usuarios",
  "/roles": "Roles",
  "/razon-social": "Razón Social",
  "/reportes": "Reportes",
  "/supervisor": "Supervisor",
  "/perfil": "Mi Perfil",
};

const MOCK_NOTIFICATIONS = [
  { id: 1, text: "Nuevo usuario registrado", time: "Hace 5 min", unread: true },
  {
    id: 2,
    text: "Reporte generado con éxito",
    time: "Hace 20 min",
    unread: true,
  },
  {
    id: 3,
    text: "Configuración actualizada",
    time: "Hace 1 hora",
    unread: false,
  },
];

export default function Topbar({ sidebarWidth }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [anchorEl, setAnchorEl] = useState(null);
  const [search, setSearch] = useState("");

  const title = PAGE_TITLES[pathname] || "Dashboard";
  const unreadCount = MOCK_NOTIFICATIONS.filter((n) => n.unread).length;
  const fullName =
    [user?.name, user?.lastName].filter(Boolean).join(" ") ||
    user?.username ||
    "Usuario";
  const initial = fullName[0].toUpperCase();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };
  const handleOpenNotif = (e) => setAnchorEl(e.currentTarget);
  const handleCloseNotif = () => setAnchorEl(null);

  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          bgcolor: "#fff",
          borderBottom: "1px solid #e2e8f0",
          color: "#0f172a",
          width: `calc(100% - ${sidebarWidth}px)`,
          ml: `${sidebarWidth}px`, // ← se desplaza a la derecha
          transition: "width 0.3s ease, margin-left 0.3s ease",
        }}
      >
        <Toolbar
          sx={{
            justifyContent: "space-between",
            gap: 2,
            minHeight: "64px !important",
          }}
        >
          {/* Título automático según ruta */}
          <Box>
            <Typography
              variant="h6"
              fontWeight={700}
              color="text.primary"
              noWrap
              lineHeight={1.2}
            >
              {title}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {new Date().toLocaleDateString("es-PE", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </Typography>
          </Box>

          {/* Acciones derecha */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            {/* Buscador */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                bgcolor: "#f1f5f9",
                borderRadius: 2,
                px: 1.5,
                py: 0.5,
                gap: 1,
                border: "1px solid transparent",
                transition: "all 0.2s",
                "&:focus-within": {
                  bgcolor: "#fff",
                  border: "1px solid #6366f1",
                  boxShadow: "0 0 0 3px rgba(99,102,241,0.1)",
                },
              }}
            >
              <Search sx={{ color: "#94a3b8", fontSize: 18 }} />
              <InputBase
                placeholder="Buscar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={{ fontSize: "0.875rem", width: 380 }}
              />
            </Box>

            {/* Notificaciones */}
            <Tooltip title="Notificaciones">
              <IconButton
                onClick={handleOpenNotif}
                size="small"
                sx={{
                  border: "1px solid #e2e8f0",
                  borderRadius: 2,
                  "&:hover": {
                    bgcolor: "rgba(99,102,241,0.06)",
                    borderColor: "#6366f1",
                  },
                }}
              >
                <Badge badgeContent={unreadCount} color="error">
                  <Notifications fontSize="small" sx={{ color: "#64748b" }} />
                </Badge>
              </IconButton>
            </Tooltip>

            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

            {/* Avatar + info usuario */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                }}
              >
                {initial}
              </Avatar>

              <Box sx={{ display: { xs: "none", sm: "block" } }}>
                <Typography
                  fontSize="0.875rem"
                  fontWeight={600}
                  lineHeight={1.2}
                >
                  {fullName}
                </Typography>
                <Chip
                  label={ROLE_LABELS[user?.role] || user?.role}
                  color={ROLE_COLORS[user?.role] || "default"}
                  size="small"
                  sx={{
                    height: 18,
                    fontSize: "0.65rem",
                    fontWeight: 600,
                    mt: 0.25,
                  }}
                />
              </Box>
            </Box>

            {/* Logout */}
            <Tooltip title="Cerrar sesión">
              <IconButton
                onClick={handleLogout}
                size="small"
                sx={{
                  border: "1px solid #e2e8f0",
                  borderRadius: 2,
                  "&:hover": {
                    bgcolor: "rgba(239,68,68,0.06)",
                    color: "error.main",
                    borderColor: "error.light",
                  },
                }}
              >
                <Logout fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Popover notificaciones */}
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleCloseNotif}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{
          sx: {
            mt: 1,
            width: 320,
            borderRadius: 3,
            boxShadow: "0 8px 30px rgba(0,0,0,0.1)",
            border: "1px solid #e2e8f0",
          },
        }}
      >
        <Box
          sx={{
            px: 2,
            py: 1.5,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid #e2e8f0",
          }}
        >
          <Typography fontWeight={600} fontSize="0.875rem">
            Notificaciones
          </Typography>
          {unreadCount > 0 && (
            <Chip
              label={`${unreadCount} nuevas`}
              size="small"
              color="primary"
              sx={{ fontSize: "0.7rem", height: 20 }}
            />
          )}
        </Box>

        <List disablePadding>
          {MOCK_NOTIFICATIONS.map((notif, index) => (
            <Box key={notif.id}>
              <ListItem
                alignItems="flex-start"
                sx={{
                  px: 2,
                  py: 1.25,
                  bgcolor: notif.unread
                    ? "rgba(99,102,241,0.03)"
                    : "transparent",
                  "&:hover": { bgcolor: "#f8f9ff", cursor: "pointer" },
                }}
              >
                <Box sx={{ display: "flex", gap: 1.5, width: "100%" }}>
                  {notif.unread ? (
                    <Circle
                      sx={{
                        color: "primary.main",
                        fontSize: 8,
                        mt: 0.75,
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <Box sx={{ width: 8, flexShrink: 0 }} />
                  )}
                  <ListItemText
                    primary={
                      <Typography
                        fontSize="0.8rem"
                        fontWeight={notif.unread ? 600 : 400}
                      >
                        {notif.text}
                      </Typography>
                    }
                    secondary={
                      <Typography fontSize="0.72rem" color="text.secondary">
                        {notif.time}
                      </Typography>
                    }
                  />
                </Box>
              </ListItem>
              {index < MOCK_NOTIFICATIONS.length - 1 && <Divider />}
            </Box>
          ))}
        </List>

        <Box
          sx={{
            px: 2,
            py: 1.25,
            borderTop: "1px solid #e2e8f0",
            textAlign: "center",
          }}
        >
          <Typography
            fontSize="0.8rem"
            color="primary.main"
            fontWeight={600}
            sx={{
              cursor: "pointer",
              "&:hover": { textDecoration: "underline" },
            }}
          >
            Ver todas las notificaciones
          </Typography>
        </Box>
      </Popover>
    </>
  );
}
