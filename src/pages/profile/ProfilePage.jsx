import {
  Email,
  Lock,
  Phone,
  Save,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { getUserMe, updateUser } from "../../api/usersApi";
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

export default function ProfilePage() {
  const { user: authUser } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Formulario contraseña
  const [passForm, setPassForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [showPass, setShowPass] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [passError, setPassError] = useState(null);
  const [passSaving, setPassSaving] = useState(false);
  const [passSuccess, setPassSuccess] = useState(null);

  useEffect(() => {
    getUserMe()
      .then(({ data }) => setProfile(data))
      .catch(() => setError("No se pudo cargar el perfil"))
      .finally(() => setLoading(false));
  }, []);

  const handlePassChange = (e) => {
    const { name, value } = e.target;
    setPassForm((prev) => ({ ...prev, [name]: value }));
    setPassError(null);
  };

  const handleChangePassword = async () => {
    setPassError(null);
    setPassSuccess(null);

    if (!passForm.current_password)
      return setPassError("Ingresa tu contraseña actual");
    if (!passForm.new_password)
      return setPassError("Ingresa la nueva contraseña");
    if (passForm.new_password.length < 6)
      return setPassError("La contraseña debe tener al menos 6 caracteres");
    if (passForm.new_password !== passForm.confirm_password)
      return setPassError("Las contraseñas no coinciden");

    setPassSaving(true);
    try {
      await updateUser(profile.id, {
        name: profile.name,
        last_name: profile.last_name,
        role_id: profile.role_id,
        password: passForm.new_password,
      });
      setPassSuccess("Contraseña actualizada correctamente");
      setPassForm({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
      setTimeout(() => setPassSuccess(null), 4000);
    } catch (err) {
      setPassError(
        err.response?.data?.detail || "Error al cambiar la contraseña",
      );
    } finally {
      setPassSaving(false);
    }
  };

  const fullName = (u) =>
    [u?.name, u?.middle_name, u?.last_name, u?.second_last_name]
      .filter(Boolean)
      .join(" ");

  const roleColors = roleColor(profile?.role?.name);

  if (loading) {
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
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          Mi Perfil
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={0.25}>
          Información de tu cuenta
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* ── Columna izquierda: info del perfil ── */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ borderRadius: 3, overflow: "hidden" }}>
            {/* Banner */}
            <Box
              sx={{
                height: 80,
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              }}
            />

            {/* Avatar y nombre */}
            <Box sx={{ px: 3, pb: 3 }}>
              <Avatar
                sx={{
                  width: 72,
                  height: 72,
                  fontSize: "1.6rem",
                  fontWeight: 700,
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  border: "4px solid #fff",
                  mt: -4.5,
                  mb: 1.5,
                }}
              >
                {profile?.name?.[0]?.toUpperCase()}
              </Avatar>

              <Typography fontWeight={700} fontSize="1.1rem">
                {fullName(profile)}
              </Typography>
              <Typography fontSize="0.82rem" color="text.secondary" mb={1.5}>
                @{profile?.username}
              </Typography>

              <Chip
                label={profile?.role?.name ?? "—"}
                size="small"
                sx={{
                  ...roleColors,
                  fontWeight: 600,
                  textTransform: "capitalize",
                  fontSize: "0.75rem",
                }}
              />

              <Divider sx={{ my: 2 }} />

              {/* Info adicional */}
              <Stack spacing={1.5}>
                {/* Emails */}
                {profile?.emails?.length > 0 && (
                  <Stack spacing={0.5}>
                    <Typography
                      fontSize="0.72rem"
                      fontWeight={600}
                      color="text.disabled"
                      textTransform="uppercase"
                      letterSpacing={0.5}
                    >
                      Correos
                    </Typography>
                    {profile.emails.map((e, i) => (
                      <Stack
                        key={i}
                        direction="row"
                        alignItems="center"
                        spacing={1}
                      >
                        <Email sx={{ fontSize: 14, color: "#6366f1" }} />
                        <Typography fontSize="0.8rem" color="text.secondary">
                          {e.email ?? e}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                )}

                {/* Teléfonos */}
                {profile?.phones?.length > 0 && (
                  <Stack spacing={0.5}>
                    <Typography
                      fontSize="0.72rem"
                      fontWeight={600}
                      color="text.disabled"
                      textTransform="uppercase"
                      letterSpacing={0.5}
                    >
                      Teléfonos
                    </Typography>
                    {profile.phones.map((p, i) => (
                      <Stack
                        key={i}
                        direction="row"
                        alignItems="center"
                        spacing={1}
                      >
                        <Phone sx={{ fontSize: 14, color: "#6366f1" }} />
                        <Typography fontSize="0.8rem" color="text.secondary">
                          {p.phone_number ?? p}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                )}

                {/* Razones sociales */}
                {profile?.razon_sociales?.length > 0 && (
                  <Stack spacing={0.5}>
                    <Typography
                      fontSize="0.72rem"
                      fontWeight={600}
                      color="text.disabled"
                      textTransform="uppercase"
                      letterSpacing={0.5}
                    >
                      Razones Sociales
                    </Typography>
                    <Stack direction="row" flexWrap="wrap" gap={0.5}>
                      {profile.razon_sociales.map((rs) => (
                        <Chip
                          key={rs.id}
                          label={rs.name}
                          size="small"
                          sx={{
                            fontSize: "0.65rem",
                            height: 20,
                            bgcolor: "rgba(99,102,241,0.08)",
                            color: "#6366f1",
                          }}
                        />
                      ))}
                    </Stack>
                  </Stack>
                )}

                {/* Supervisor */}
                {profile?.supervisor && (
                  <Stack spacing={0.5}>
                    <Typography
                      fontSize="0.72rem"
                      fontWeight={600}
                      color="text.disabled"
                      textTransform="uppercase"
                      letterSpacing={0.5}
                    >
                      Supervisor
                    </Typography>
                    <Typography fontSize="0.82rem" color="text.secondary">
                      {profile.supervisor.name} {profile.supervisor.last_name}
                    </Typography>
                  </Stack>
                )}

                {/* Estado */}
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      bgcolor: profile?.is_active ? "#10b981" : "#9ca3af",
                    }}
                  />
                  <Typography fontSize="0.8rem" color="text.secondary">
                    {profile?.is_active ? "Cuenta activa" : "Cuenta inactiva"}
                  </Typography>
                </Stack>
              </Stack>
            </Box>
          </Paper>
        </Grid>

        {/* ── Columna derecha: cambiar contraseña ── */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ borderRadius: 3, p: 3 }}>
            <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 2,
                  bgcolor: "rgba(99,102,241,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Lock sx={{ fontSize: 18, color: "#6366f1" }} />
              </Box>
              <Box>
                <Typography fontWeight={700} fontSize="1rem">
                  Cambiar contraseña
                </Typography>
                <Typography fontSize="0.78rem" color="text.secondary">
                  Actualiza tu contraseña de acceso
                </Typography>
              </Box>
            </Stack>

            {passError && (
              <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
                {passError}
              </Alert>
            )}
            {passSuccess && (
              <Alert severity="success" sx={{ mb: 2.5, borderRadius: 2 }}>
                {passSuccess}
              </Alert>
            )}

            <Stack spacing={2.5}>
              {/* Contraseña actual */}
              <Box>
                <Typography fontSize="0.8rem" fontWeight={500} mb={0.75}>
                  Contraseña actual
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  name="current_password"
                  type={showPass.current ? "text" : "password"}
                  value={passForm.current_password}
                  onChange={handlePassChange}
                  placeholder="Ingresa tu contraseña actual"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() =>
                            setShowPass((p) => ({ ...p, current: !p.current }))
                          }
                        >
                          {showPass.current ? (
                            <VisibilityOff fontSize="small" />
                          ) : (
                            <Visibility fontSize="small" />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              <Divider />

              {/* Nueva contraseña */}
              <Box>
                <Typography fontSize="0.8rem" fontWeight={500} mb={0.75}>
                  Nueva contraseña
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  name="new_password"
                  type={showPass.new ? "text" : "password"}
                  value={passForm.new_password}
                  onChange={handlePassChange}
                  placeholder="Mínimo 6 caracteres"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() =>
                            setShowPass((p) => ({ ...p, new: !p.new }))
                          }
                        >
                          {showPass.new ? (
                            <VisibilityOff fontSize="small" />
                          ) : (
                            <Visibility fontSize="small" />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                {/* Indicador de fortaleza */}
                {passForm.new_password && (
                  <Box sx={{ mt: 1 }}>
                    <Stack direction="row" spacing={0.5} mb={0.5}>
                      {[1, 2, 3, 4].map((level) => {
                        const strength =
                          passForm.new_password.length >= 12
                            ? 4
                            : passForm.new_password.length >= 8
                              ? 3
                              : passForm.new_password.length >= 6
                                ? 2
                                : 1;
                        return (
                          <Box
                            key={level}
                            sx={{
                              flex: 1,
                              height: 3,
                              borderRadius: 2,
                              bgcolor:
                                level <= strength
                                  ? strength === 1
                                    ? "#ef4444"
                                    : strength === 2
                                      ? "#f59e0b"
                                      : strength === 3
                                        ? "#6366f1"
                                        : "#10b981"
                                  : "#e2e8f0",
                              transition: "background 0.2s",
                            }}
                          />
                        );
                      })}
                    </Stack>
                    <Typography fontSize="0.72rem" color="text.secondary">
                      {passForm.new_password.length < 6
                        ? "Muy corta"
                        : passForm.new_password.length < 8
                          ? "Débil"
                          : passForm.new_password.length < 12
                            ? "Buena"
                            : "Fuerte"}
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Confirmar contraseña */}
              <Box>
                <Typography fontSize="0.8rem" fontWeight={500} mb={0.75}>
                  Confirmar nueva contraseña
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  name="confirm_password"
                  type={showPass.confirm ? "text" : "password"}
                  value={passForm.confirm_password}
                  onChange={handlePassChange}
                  placeholder="Repite la nueva contraseña"
                  error={
                    Boolean(passForm.confirm_password) &&
                    passForm.new_password !== passForm.confirm_password
                  }
                  helperText={
                    passForm.confirm_password &&
                    passForm.new_password !== passForm.confirm_password
                      ? "Las contraseñas no coinciden"
                      : passForm.confirm_password &&
                          passForm.new_password === passForm.confirm_password
                        ? "✓ Las contraseñas coinciden"
                        : ""
                  }
                  FormHelperTextProps={{
                    sx: {
                      color:
                        passForm.new_password === passForm.confirm_password &&
                        passForm.confirm_password
                          ? "#10b981"
                          : "error.main",
                    },
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() =>
                            setShowPass((p) => ({ ...p, confirm: !p.confirm }))
                          }
                        >
                          {showPass.confirm ? (
                            <VisibilityOff fontSize="small" />
                          ) : (
                            <Visibility fontSize="small" />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              <Button
                variant="contained"
                onClick={handleChangePassword}
                disabled={
                  passSaving ||
                  !passForm.current_password ||
                  !passForm.new_password ||
                  !passForm.confirm_password
                }
                startIcon={passSaving ? null : <Save />}
                sx={{
                  borderRadius: 2,
                  px: 4,
                  width: { xs: "100%", sm: "auto" },
                  alignSelf: "flex-start",
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                }}
              >
                {passSaving ? (
                  <CircularProgress size={20} sx={{ color: "#fff" }} />
                ) : (
                  "Guardar contraseña"
                )}
              </Button>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
