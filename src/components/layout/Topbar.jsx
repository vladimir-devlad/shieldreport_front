import { Circle, Logout, Notifications } from "@mui/icons-material";
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Chip,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Popover,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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

const PAGE_TITLES = {
  "/dashboard": "Dashboard",
  "/users": "Usuarios",
  "/roles": "Roles",
  "/razon-social": "Razón Social",
  "/razon-social/asignar": "Asignar Razón Social",
  "/reportes": "Reportes",
  "/supervisor": "Supervisor",
  "/profile": "Mi Perfil",
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

export default function Topbar({ sidebarWidth, isMobile }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [anchorNotif, setAnchorNotif] = useState(null);

  const title = PAGE_TITLES[pathname] || "Dashboard";
  const unreadCount = MOCK_NOTIFICATIONS.filter((n) => n.unread).length;
  const fullName =
    [user?.name, user?.last_name].filter(Boolean).join(" ") ||
    user?.username ||
    "Usuario";
  const initial = fullName[0]?.toUpperCase() ?? "U";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };
  const handleOpenNotif = (e) => setAnchorNotif(e.currentTarget);
  const handleCloseNotif = () => setAnchorNotif(null);

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
          left: isMobile ? 0 : sidebarWidth,
          width: isMobile ? "100%" : `calc(100% - ${sidebarWidth}px)`,
          transition: "left 0.25s ease, width 0.25s ease",
          boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
        }}
      >
        <Toolbar
          sx={{
            justifyContent: "space-between",
            gap: 2,
            minHeight: "64px !important",
            px: { xs: 2, sm: 3 },
          }}
        >
          {/* ── Izquierda: Título + fecha ── */}
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              variant="h6"
              fontWeight={700}
              color="text.primary"
              noWrap
              lineHeight={1.2}
              fontSize={{ xs: "0.95rem", sm: "1.1rem" }}
            >
              {title}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: { xs: "none", sm: "block" } }}
            >
              {new Date().toLocaleDateString("es-PE", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </Typography>
          </Box>

          {/* ── Derecha: Notificaciones + Avatar + Logout ── */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: { xs: 0.5, sm: 1.5 },
            }}
          >
            {/* Notificaciones */}
            <Tooltip title="Notificaciones">
              <IconButton onClick={handleOpenNotif} size="small">
                <Badge
                  badgeContent={unreadCount}
                  color="error"
                  sx={{
                    "& .MuiBadge-badge": {
                      fontSize: "0.6rem",
                      minWidth: 16,
                      height: 16,
                    },
                  }}
                >
                  <Notifications sx={{ fontSize: 22, color: "#64748b" }} />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* Avatar + info usuario */}
            <Tooltip title="Mi perfil">
              <Box
                onClick={() => navigate("/profile")}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.25,
                  cursor: "pointer",
                  borderRadius: 2,
                  px: { xs: 0.5, sm: 1 },
                  py: 0.5,
                  "&:hover": { bgcolor: "rgba(99,102,241,0.06)" },
                  transition: "background 0.15s",
                }}
              >
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
                    noWrap
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
            </Tooltip>

            {/* Logout */}
            <Tooltip title="Cerrar sesión">
              <IconButton
                onClick={handleLogout}
                size="small"
                sx={{
                  "&:hover": {
                    color: "#ef4444",
                    bgcolor: "rgba(239,68,68,0.06)",
                  },
                  color: "#64748b",
                }}
              >
                <Logout fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* ── Popover notificaciones ── */}
      <Popover
        open={Boolean(anchorNotif)}
        anchorEl={anchorNotif}
        onClose={handleCloseNotif}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{
          sx: {
            mt: 1,
            width: { xs: 290, sm: 320 },
            borderRadius: 3,
            boxShadow: "0 8px 30px rgba(0,0,0,0.1)",
            border: "1px solid #e2e8f0",
          },
        }}
      >
        {/* Header notificaciones */}
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

        {/* Lista */}
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

        {/* Footer */}
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
