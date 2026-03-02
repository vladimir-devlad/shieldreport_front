import {
  ArrowBack,
  Block,
  Business,
  CalendarToday,
  Edit,
  Email,
  Person,
  Phone,
} from "@mui/icons-material";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getUserById } from "../../api/usersApi";
import { useAuth } from "../../context/AuthContext";

const roleColor = (roleName) => {
  const map = {
    superadmin: { bgcolor: "rgba(239,68,68,0.1)", color: "#ef4444" },
    admin: { bgcolor: "rgba(245,158,11,0.1)", color: "#f59e0b" },
    supervisor: { bgcolor: "rgba(99,102,241,0.1)", color: "#6366f1" },
    usuario: { bgcolor: "rgba(16,185,129,0.1)", color: "#10b981" },
  };
  return (
    map[roleName?.toLowerCase()] ?? {
      bgcolor: "rgba(156,163,175,0.15)",
      color: "#9ca3af",
    }
  );
};

const fullName = (u) =>
  [u?.name, u?.middle_name, u?.last_name, u?.second_last_name]
    .filter(Boolean)
    .join(" ");

function InfoRow({ icon, label, value }) {
  return (
    <Stack direction="row" spacing={1.5} alignItems="flex-start">
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: 1.5,
          flexShrink: 0,
          bgcolor: "rgba(99,102,241,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography
          fontSize="0.72rem"
          color="text.disabled"
          textTransform="uppercase"
          letterSpacing={0.5}
          fontWeight={600}
        >
          {label}
        </Typography>
        <Typography fontSize="0.875rem" color="text.primary" mt={0.25}>
          {value || "—"}
        </Typography>
      </Box>
    </Stack>
  );
}

export default function UserDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasRole } = useAuth();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    getUserById(id)
      .then(({ data }) => setUser(data))
      .catch(() => setError("No se pudo cargar el usuario"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading)
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 300,
        }}
      >
        <CircularProgress sx={{ color: "#6366f1" }} />
      </Box>
    );

  if (error)
    return (
      <Box>
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          {error}
        </Alert>
        <Button
          sx={{ mt: 2 }}
          onClick={() => navigate("/users")}
          startIcon={<ArrowBack />}
        >
          Volver
        </Button>
      </Box>
    );

  const colors = roleColor(user?.role?.name);

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={2} mb={3}>
        <Tooltip title="Volver a usuarios">
          <IconButton
            onClick={() => navigate("/users")}
            sx={{ border: "1px solid #e2e8f0", borderRadius: 2 }}
          >
            <ArrowBack fontSize="small" />
          </IconButton>
        </Tooltip>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" fontWeight={700}>
            Detalle de usuario
          </Typography>
          <Typography variant="body2" color="text.secondary">
            @{user?.username}
          </Typography>
        </Box>
        {hasRole("superadmin", "admin") && (
          <Button
            variant="contained"
            startIcon={<Edit />}
            onClick={() => navigate(`/users/${id}/edit`)}
            sx={{
              borderRadius: 2,
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            }}
          >
            Editar usuario
          </Button>
        )}
      </Stack>

      <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
        {/* ── Columna izquierda: perfil ── */}
        <Paper sx={{ borderRadius: 3, overflow: "hidden", flex: "0 0 300px" }}>
          {/* Banner */}
          <Box
            sx={{
              height: 80,
              background: user?.is_active
                ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                : "linear-gradient(135deg, #9ca3af, #d1d5db)",
            }}
          />

          <Box sx={{ px: 3, pb: 3 }}>
            <Avatar
              sx={{
                width: 72,
                height: 72,
                fontSize: "1.6rem",
                fontWeight: 700,
                background: user?.is_active
                  ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                  : "#9ca3af",
                border: "4px solid #fff",
                mt: -4.5,
                mb: 1.5,
              }}
            >
              {user?.name?.[0]?.toUpperCase()}
            </Avatar>

            <Typography fontWeight={700} fontSize="1.1rem">
              {fullName(user)}
            </Typography>
            <Typography fontSize="0.82rem" color="text.secondary" mb={1.5}>
              @{user?.username}
            </Typography>

            <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.75}>
              <Chip
                label={user?.role?.name ?? "—"}
                size="small"
                sx={{
                  ...colors,
                  fontWeight: 600,
                  textTransform: "capitalize",
                  fontSize: "0.75rem",
                }}
              />
              <Chip
                label={user?.is_active ? "Activo" : "Inactivo"}
                size="small"
                sx={{
                  fontWeight: 600,
                  fontSize: "0.75rem",
                  bgcolor: user?.is_active
                    ? "rgba(16,185,129,0.1)"
                    : "rgba(156,163,175,0.15)",
                  color: user?.is_active ? "#10b981" : "#9ca3af",
                }}
              />
            </Stack>

            <Divider sx={{ my: 2 }} />

            {/* Fechas */}
            <Stack spacing={1.5}>
              <Stack direction="row" spacing={1} alignItems="center">
                <CalendarToday sx={{ fontSize: 14, color: "#6366f1" }} />
                <Box>
                  <Typography fontSize="0.7rem" color="text.disabled">
                    Creado
                  </Typography>
                  <Typography fontSize="0.8rem">
                    {user?.created_at
                      ? new Date(user.created_at).toLocaleDateString("es-PE", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })
                      : "—"}
                  </Typography>
                </Box>
              </Stack>
              {!user?.is_active && user?.updated_at && (
                <Stack direction="row" spacing={1} alignItems="center">
                  <Block sx={{ fontSize: 14, color: "#9ca3af" }} />
                  <Box>
                    <Typography fontSize="0.7rem" color="text.disabled">
                      Dado de baja
                    </Typography>
                    <Typography fontSize="0.8rem">
                      {new Date(user.updated_at).toLocaleDateString("es-PE", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </Typography>
                  </Box>
                </Stack>
              )}
            </Stack>
          </Box>
        </Paper>

        {/* ── Columna derecha: detalles ── */}
        <Stack spacing={2.5} sx={{ flex: 1 }}>
          {/* Datos personales */}
          <Paper sx={{ borderRadius: 3, p: 3 }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={2.5}>
              <Person sx={{ fontSize: 18, color: "#6366f1" }} />
              <Typography fontWeight={700} fontSize="0.95rem">
                Datos personales
              </Typography>
            </Stack>
            <Stack spacing={2}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <InfoRow
                  icon={<Person sx={{ fontSize: 16, color: "#6366f1" }} />}
                  label="Nombre"
                  value={user?.name}
                />
                <InfoRow
                  icon={<Person sx={{ fontSize: 16, color: "#6366f1" }} />}
                  label="Segundo nombre"
                  value={user?.middle_name}
                />
              </Stack>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <InfoRow
                  icon={<Person sx={{ fontSize: 16, color: "#6366f1" }} />}
                  label="Apellido paterno"
                  value={user?.last_name}
                />
                <InfoRow
                  icon={<Person sx={{ fontSize: 16, color: "#6366f1" }} />}
                  label="Apellido materno"
                  value={user?.second_last_name}
                />
              </Stack>
            </Stack>
          </Paper>

          {/* Contacto */}
          <Paper sx={{ borderRadius: 3, p: 3 }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={2.5}>
              <Email sx={{ fontSize: 18, color: "#6366f1" }} />
              <Typography fontWeight={700} fontSize="0.95rem">
                Contacto
              </Typography>
            </Stack>
            <Stack spacing={2}>
              {/* Emails */}
              <Box>
                <Typography
                  fontSize="0.72rem"
                  color="text.disabled"
                  textTransform="uppercase"
                  letterSpacing={0.5}
                  fontWeight={600}
                  mb={1}
                >
                  Correos electrónicos
                </Typography>
                {user?.emails?.length > 0 ? (
                  user.emails.map((e, i) => (
                    <Stack
                      key={i}
                      direction="row"
                      alignItems="center"
                      spacing={1}
                      mb={0.5}
                    >
                      <Email sx={{ fontSize: 14, color: "#6366f1" }} />
                      <Typography fontSize="0.875rem">
                        {e.email ?? e}
                      </Typography>
                    </Stack>
                  ))
                ) : (
                  <Typography fontSize="0.85rem" color="text.disabled">
                    Sin correos registrados
                  </Typography>
                )}
              </Box>

              <Divider />

              {/* Teléfonos */}
              <Box>
                <Typography
                  fontSize="0.72rem"
                  color="text.disabled"
                  textTransform="uppercase"
                  letterSpacing={0.5}
                  fontWeight={600}
                  mb={1}
                >
                  Teléfonos
                </Typography>
                {user?.phones?.length > 0 ? (
                  user.phones.map((p, i) => (
                    <Stack
                      key={i}
                      direction="row"
                      alignItems="center"
                      spacing={1}
                      mb={0.5}
                    >
                      <Phone sx={{ fontSize: 14, color: "#6366f1" }} />
                      <Typography fontSize="0.875rem">
                        {p.phone_number ?? p}
                      </Typography>
                    </Stack>
                  ))
                ) : (
                  <Typography fontSize="0.85rem" color="text.disabled">
                    Sin teléfonos registrados
                  </Typography>
                )}
              </Box>
            </Stack>
          </Paper>

          {/* Razones sociales y supervisor */}
          <Paper sx={{ borderRadius: 3, p: 3 }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={2.5}>
              <Business sx={{ fontSize: 18, color: "#6366f1" }} />
              <Typography fontWeight={700} fontSize="0.95rem">
                Asignaciones
              </Typography>
            </Stack>
            <Stack spacing={2}>
              {/* Razones sociales */}
              <Box>
                <Typography
                  fontSize="0.72rem"
                  color="text.disabled"
                  textTransform="uppercase"
                  letterSpacing={0.5}
                  fontWeight={600}
                  mb={1}
                >
                  Razones Sociales
                </Typography>
                {user?.razon_sociales?.length > 0 ? (
                  <Stack direction="row" flexWrap="wrap" gap={0.75}>
                    {user.razon_sociales.map((rs) => (
                      <Chip
                        key={rs.id}
                        label={rs.name}
                        size="small"
                        sx={{
                          bgcolor: "rgba(99,102,241,0.08)",
                          color: "#6366f1",
                          fontSize: "0.75rem",
                          fontWeight: 500,
                        }}
                      />
                    ))}
                  </Stack>
                ) : (
                  <Typography fontSize="0.85rem" color="text.disabled">
                    Sin razones sociales asignadas
                  </Typography>
                )}
              </Box>

              <Divider />

              {/* Supervisor */}
              <Box>
                <Typography
                  fontSize="0.72rem"
                  color="text.disabled"
                  textTransform="uppercase"
                  letterSpacing={0.5}
                  fontWeight={600}
                  mb={1}
                >
                  Supervisor
                </Typography>
                {user?.supervisores?.length > 0 ? (
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Avatar
                      sx={{
                        width: 28,
                        height: 28,
                        fontSize: "0.75rem",
                        bgcolor: "rgba(99,102,241,0.1)",
                        color: "#6366f1",
                      }}
                    >
                      {user.supervisores[0].name?.[0]?.toUpperCase()}
                    </Avatar>
                    <Typography fontSize="0.875rem">
                      {user.supervisores[0].name}{" "}
                      {user.supervisores[0].last_name}
                    </Typography>
                  </Stack>
                ) : (
                  <Typography fontSize="0.85rem" color="text.disabled">
                    Sin supervisor asignado
                  </Typography>
                )}
              </Box>
            </Stack>
          </Paper>
        </Stack>
      </Stack>
    </Box>
  );
}
