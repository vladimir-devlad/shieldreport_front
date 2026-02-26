import {
  ArrowForward,
  Business,
  Group,
  People,
  PersonOff,
  Shield,
  WavingHand,
} from "@mui/icons-material";
import {
  Box,
  Chip,
  Grid,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getRazonesSociales } from "../../api/razonSocialApi";
import { getUsers, getUsersSinSuper } from "../../api/usersApi";
import { useAuth } from "../../context/AuthContext";

// ── Accesos rápidos por rol ───────────────────────
const quickAccessByRole = {
  superadmin: [
    {
      label: "Gestionar usuarios",
      path: "/users",
      icon: <People sx={{ fontSize: 20 }} />,
      color: "#6366f1",
    },
    {
      label: "Supervisores",
      path: "/supervisor",
      icon: <Group sx={{ fontSize: 20 }} />,
      color: "#8b5cf6",
    },
    {
      label: "Razón Social",
      path: "/razon-social",
      icon: <Business sx={{ fontSize: 20 }} />,
      color: "#06b6d4",
    },
    {
      label: "Asignar RS",
      path: "/razon-social/asignar",
      icon: <Shield sx={{ fontSize: 20 }} />,
      color: "#10b981",
    },
  ],
  admin: [
    {
      label: "Gestionar usuarios",
      path: "/users",
      icon: <People sx={{ fontSize: 20 }} />,
      color: "#6366f1",
    },
    {
      label: "Supervisores",
      path: "/supervisor",
      icon: <Group sx={{ fontSize: 20 }} />,
      color: "#8b5cf6",
    },
    {
      label: "Asignar RS",
      path: "/razon-social/asignar",
      icon: <Shield sx={{ fontSize: 20 }} />,
      color: "#10b981",
    },
  ],
  supervisor: [
    {
      label: "Mi Grupo",
      path: "/supervisor",
      icon: <Group sx={{ fontSize: 20 }} />,
      color: "#6366f1",
    },
    {
      label: "Asignar RS",
      path: "/razon-social/asignar",
      icon: <Shield sx={{ fontSize: 20 }} />,
      color: "#10b981",
    },
  ],
  usuario: [
    {
      label: "Reportes",
      path: "/reportes",
      icon: <Shield sx={{ fontSize: 20 }} />,
      color: "#6366f1",
    },
  ],
};

// ── Stat card ────────────────────────────────────
function StatCard({ icon, label, value, color, loading, sub }) {
  return (
    <Paper
      sx={{
        borderRadius: 3,
        p: 2.5,
        border: "1px solid #f0f0f0",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decoración de fondo */}
      <Box
        sx={{
          position: "absolute",
          top: -16,
          right: -16,
          width: 72,
          height: 72,
          borderRadius: "50%",
          bgcolor: `${color}18`,
        }}
      />

      <Stack
        direction="row"
        alignItems="flex-start"
        justifyContent="space-between"
      >
        <Box>
          <Typography
            fontSize="0.78rem"
            color="text.secondary"
            fontWeight={500}
            mb={0.75}
          >
            {label}
          </Typography>
          {loading ? (
            <Skeleton variant="text" width={48} height={40} />
          ) : (
            <Typography
              fontSize="2rem"
              fontWeight={800}
              lineHeight={1}
              color="#1e293b"
            >
              {value ?? "—"}
            </Typography>
          )}
          {sub && !loading && (
            <Typography fontSize="0.72rem" color="text.disabled" mt={0.5}>
              {sub}
            </Typography>
          )}
        </Box>
        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: 2,
            bgcolor: `${color}15`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color,
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
      </Stack>
    </Paper>
  );
}

// ── Quick access card ────────────────────────────
function QuickCard({ item }) {
  const navigate = useNavigate();
  return (
    <Paper
      onClick={() => navigate(item.path)}
      sx={{
        borderRadius: 3,
        p: 2,
        cursor: "pointer",
        border: "1px solid #f0f0f0",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        transition: "all 0.15s",
        "&:hover": {
          borderColor: item.color,
          transform: "translateY(-2px)",
          boxShadow: `0 4px 20px ${item.color}20`,
        },
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <Box
          sx={{
            width: 38,
            height: 38,
            borderRadius: 2,
            bgcolor: `${item.color}12`,
            color: item.color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {item.icon}
        </Box>
        <Typography fontWeight={600} fontSize="0.875rem">
          {item.label}
        </Typography>
      </Stack>
      <ArrowForward sx={{ fontSize: 16, color: "text.disabled" }} />
    </Paper>
  );
}

// ── Página principal ─────────────────────────────
export default function DashboardPage() {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    users: null,
    rs: null,
    sinSuper: null,
    activos: null,
  });
  const [loading, setLoading] = useState(true);

  // Saludo dinámico por hora
  const hora = new Date().getHours();
  const saludo =
    hora < 12 ? "Buenos días" : hora < 19 ? "Buenas tardes" : "Buenas noches";
  const firstName = user?.name ?? "Usuario";

  // Accesos rápidos según rol
  const role = user?.role?.toLowerCase();
  const accesos = quickAccessByRole[role] ?? quickAccessByRole.usuario;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [{ data: usersData }, { data: rsData }] = await Promise.all([
          getUsers(),
          getRazonesSociales(),
        ]);

        const allUsers = Array.isArray(usersData)
          ? usersData
          : (usersData.data ?? []);
        const allRS = Array.isArray(rsData) ? rsData : (rsData.data ?? []);

        const activos = allUsers.filter((u) => u.is_active).length;
        const rsActivas = allRS.filter((r) => r.is_active).length;

        // Solo superadmin/admin necesitan saber usuarios sin supervisor
        let sinSuper = null;
        if (hasRole("superadmin") || hasRole("admin")) {
          try {
            const { data: sinSuperData } = await getUsersSinSuper({
              page: 1,
              limit: 1,
            });
            sinSuper = sinSuperData.total ?? 0;
          } catch {
            sinSuper = 0;
          }
        }

        setStats({
          users: allUsers.length,
          activos,
          rs: rsActivas,
          sinSuper,
        });
      } catch {
        // Si falla, dejamos nulls — el UI lo maneja con "—"
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [hasRole]);

  return (
    <Box>
      {/* ── Bienvenida ── */}
      <Paper
        sx={{
          borderRadius: 3,
          p: 3.5,
          mb: 3,
          background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
          color: "#fff",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Círculos decorativos */}
        <Box
          sx={{
            position: "absolute",
            top: -40,
            right: -40,
            width: 180,
            height: 180,
            borderRadius: "50%",
            bgcolor: "rgba(255,255,255,0.07)",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            bottom: -60,
            right: 80,
            width: 120,
            height: 120,
            borderRadius: "50%",
            bgcolor: "rgba(255,255,255,0.05)",
          }}
        />

        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ sm: "center" }}
          justifyContent="space-between"
          spacing={2}
        >
          <Box>
            <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
              <WavingHand sx={{ fontSize: 22, color: "#fcd34d" }} />
              <Typography fontSize="0.9rem" sx={{ opacity: 0.85 }}>
                {saludo}
              </Typography>
            </Stack>
            <Typography
              fontSize="1.6rem"
              fontWeight={800}
              lineHeight={1.2}
              mb={1}
            >
              {firstName}
            </Typography>
            <Chip
              label={user?.role ?? "—"}
              size="small"
              sx={{
                bgcolor: "rgba(255,255,255,0.2)",
                color: "#fff",
                fontWeight: 600,
                fontSize: "0.72rem",
                textTransform: "capitalize",
              }}
            />
          </Box>

          <Box sx={{ textAlign: { sm: "right" }, flexShrink: 0 }}>
            <Typography fontSize="0.78rem" sx={{ opacity: 0.7 }}>
              {new Date().toLocaleDateString("es-PE", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </Typography>
          </Box>
        </Stack>
      </Paper>

      {/* ── Stats ── */}
      {(hasRole("superadmin") || hasRole("admin")) && (
        <>
          <Typography
            fontWeight={700}
            fontSize="0.85rem"
            color="text.secondary"
            textTransform="uppercase"
            letterSpacing={0.5}
            mb={1.5}
          >
            Resumen
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard
                icon={<People sx={{ fontSize: 22 }} />}
                label="Total usuarios"
                value={stats.users}
                color="#6366f1"
                loading={loading}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard
                icon={<People sx={{ fontSize: 22 }} />}
                label="Usuarios activos"
                value={stats.activos}
                color="#10b981"
                loading={loading}
                sub={
                  stats.users
                    ? `${Math.round((stats.activos / stats.users) * 100)}% del total`
                    : null
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard
                icon={<Business sx={{ fontSize: 22 }} />}
                label="RS activas"
                value={stats.rs}
                color="#06b6d4"
                loading={loading}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard
                icon={<PersonOff sx={{ fontSize: 22 }} />}
                label="Sin supervisor"
                value={stats.sinSuper}
                color="#f59e0b"
                loading={loading}
                sub="Usuarios sin asignar"
              />
            </Grid>
          </Grid>
        </>
      )}

      {/* ── Accesos rápidos ── */}
      <Typography
        fontWeight={700}
        fontSize="0.85rem"
        color="text.secondary"
        textTransform="uppercase"
        letterSpacing={0.5}
        mb={1.5}
      >
        Accesos rápidos
      </Typography>
      <Grid container spacing={2}>
        {accesos.map((item) => (
          <Grid key={item.path} size={{ xs: 12, sm: 6, md: 4 }}>
            <QuickCard item={item} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
