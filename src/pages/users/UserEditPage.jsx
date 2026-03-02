import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
  Checkbox,
  Paper as MuiPaper,
} from "@mui/material";
import {
  ArrowBack,
  Add,
  Email,
  Phone,
  Search,
  Business,
  Save,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import { getUserById, updateUser } from "../../api/usersApi";
import { getRoles } from "../../api/rolesApi";
import { getRazonesSociales } from "../../api/razonSocialApi";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\+?[1-9]\d{6,14}$/;

export default function UserEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [razones, setRazones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchRS, setSearchRS] = useState("");
  const [showPass, setShowPass] = useState(false);

  const [emailInput, setEmailInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");

  const [form, setForm] = useState(null);

  useEffect(() => {
    Promise.all([getUserById(id), getRoles(), getRazonesSociales()])
      .then(([{ data: u }, { data: rolesData }, { data: rsData }]) => {
        setUser(u);
        setRoles(rolesData);
        const allRS = Array.isArray(rsData) ? rsData : (rsData.data ?? []);
        setRazones(allRS.filter((r) => r.is_active));
        setForm({
          name: u.name ?? "",
          middle_name: u.middle_name ?? "",
          last_name: u.last_name ?? "",
          second_last_name: u.second_last_name ?? "",
          username: u.username ?? "",
          password: "",
          role_id: u.role_id ?? "",
          is_active: u.is_active ?? true,
          razon_social_ids: u.razon_sociales?.map((r) => r.id) ?? [],
          emails: u.emails?.map((e) => e.email ?? e) ?? [],
          phones: u.phones?.map((p) => p.phone_number ?? p) ?? [],
        });
      })
      .catch(() => setError("No se pudieron cargar los datos"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // ── RS ──────────────────────────────────────────
  const filteredRS = razones.filter(
    (r) => !searchRS || r.name.toLowerCase().includes(searchRS.toLowerCase()),
  );

  const handleToggleRS = (rsId) => {
    setForm((prev) => ({
      ...prev,
      razon_social_ids: prev.razon_social_ids.includes(rsId)
        ? prev.razon_social_ids.filter((x) => x !== rsId)
        : [...prev.razon_social_ids, rsId],
    }));
  };

  const handleSelectAllRS = () => {
    const allIds = filteredRS.map((r) => r.id);
    const allSelected = allIds.every((id) =>
      form.razon_social_ids.includes(id),
    );
    setForm((prev) => ({
      ...prev,
      razon_social_ids: allSelected
        ? prev.razon_social_ids.filter((id) => !allIds.includes(id))
        : [...new Set([...prev.razon_social_ids, ...allIds])],
    }));
  };

  // ── Emails ──────────────────────────────────────
  const handleAddEmail = () => {
    const val = emailInput.trim().toLowerCase();
    if (!val) return;
    if (!emailRegex.test(val)) return setEmailError("Email inválido");
    if (form.emails.includes(val)) return setEmailError("Email ya agregado");
    setForm((prev) => ({ ...prev, emails: [...prev.emails, val] }));
    setEmailInput("");
    setEmailError("");
  };

  // ── Teléfonos ────────────────────────────────────
  const handleAddPhone = () => {
    const val = phoneInput.trim();
    if (!val) return;
    if (!phoneRegex.test(val))
      return setPhoneError("Formato inválido. Ej: +51987654321");
    if (form.phones.includes(val)) return setPhoneError("Teléfono ya agregado");
    setForm((prev) => ({ ...prev, phones: [...prev.phones, val] }));
    setPhoneInput("");
    setPhoneError("");
  };

  // ── Submit ───────────────────────────────────────
  const handleSubmit = async () => {
    setError(null);
    if (!form.name.trim()) return setError("El nombre es obligatorio");
    if (!form.last_name.trim())
      return setError("El apellido paterno es obligatorio");
    if (!form.role_id) return setError("El rol es obligatorio");

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        last_name: form.last_name.trim(),
        username: form.username,
        role_id: Number(form.role_id),
        is_active: form.is_active,
        emails: form.emails,
        phones: form.phones,
        razon_social_ids: form.razon_social_ids,
        ...(form.middle_name?.trim() && {
          middle_name: form.middle_name.trim(),
        }),
        ...(form.second_last_name?.trim() && {
          second_last_name: form.second_last_name.trim(),
        }),
        ...(form.password && { password: form.password }),
      };
      await updateUser(id, payload);
      setSuccess("Cambios guardados correctamente");
      // Recargamos el usuario para ver los cambios
      const { data: updated } = await getUserById(id);
      setUser(updated);
      setForm((prev) => ({
        ...prev,
        razon_social_ids: updated.razon_sociales?.map((r) => r.id) ?? [],
        emails: updated.emails?.map((e) => e.email ?? e) ?? [],
        phones: updated.phones?.map((p) => p.phone_number ?? p) ?? [],
        password: "",
      }));
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || "Error al guardar los cambios");
    } finally {
      setSaving(false);
    }
  };

  const allFilteredSelected =
    filteredRS.length > 0 &&
    filteredRS.every((r) => form?.razon_social_ids.includes(r.id));
  const someFilteredSelected = filteredRS.some((r) =>
    form?.razon_social_ids.includes(r.id),
  );

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

  if (!form) return null;

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={2} mb={3}>
        <IconButton
          onClick={() => navigate(`/users/${id}`)}
          sx={{ border: "1px solid #e2e8f0", borderRadius: 2 }}
        >
          <ArrowBack fontSize="small" />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" fontWeight={700}>
            Editar usuario
          </Typography>
          <Typography variant="body2" color="text.secondary">
            @{user?.username}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={saving ? null : <Save />}
          onClick={handleSubmit}
          disabled={saving}
          sx={{
            borderRadius: 2,
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            px: 3,
          }}
        >
          {saving ? (
            <CircularProgress size={20} sx={{ color: "#fff" }} />
          ) : (
            "Guardar cambios"
          )}
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2.5, borderRadius: 2 }}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* ── Datos personales ── */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ borderRadius: 3, p: 3 }}>
            <Typography fontWeight={700} fontSize="0.95rem" mb={2.5}>
              Datos personales
            </Typography>
            <Stack spacing={2}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Nombre *"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Segundo nombre"
                    name="middle_name"
                    value={form.middle_name}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Apellido paterno *"
                    name="last_name"
                    value={form.last_name}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Apellido materno"
                    name="second_last_name"
                    value={form.second_last_name}
                    onChange={handleChange}
                  />
                </Grid>
              </Grid>
            </Stack>
          </Paper>
        </Grid>

        {/* ── Cuenta ── */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ borderRadius: 3, p: 3 }}>
            <Typography fontWeight={700} fontSize="0.95rem" mb={2.5}>
              Cuenta
            </Typography>
            <Stack spacing={2}>
              <TextField
                fullWidth
                size="small"
                label="Username"
                name="username"
                value={form.username}
                onChange={handleChange}
                helperText="Puedes modificar el username generado automáticamente"
              />

              <TextField
                fullWidth
                size="small"
                label="Nueva contraseña (opcional)"
                name="password"
                value={form.password}
                onChange={handleChange}
                type={showPass ? "text" : "password"}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setShowPass((s) => !s)}
                      >
                        {showPass ? (
                          <VisibilityOff fontSize="small" />
                        ) : (
                          <Visibility fontSize="small" />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                select
                fullWidth
                size="small"
                label="Rol *"
                name="role_id"
                value={
                  roles.some((r) => r.id === form.role_id) ? form.role_id : ""
                }
                onChange={handleChange}
              >
                <MenuItem value="" disabled>
                  Selecciona un rol
                </MenuItem>
                {roles.map((r) => (
                  <MenuItem key={r.id} value={r.id}>
                    {r.name}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                fullWidth
                size="small"
                label="Estado"
                name="is_active"
                value={form.is_active}
                onChange={handleChange}
              >
                <MenuItem value={true}>Activo</MenuItem>
                <MenuItem value={false}>Inactivo</MenuItem>
              </TextField>
            </Stack>
          </Paper>
        </Grid>

        {/* ── Razón Social ── */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ borderRadius: 3, p: 3 }}>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              mb={2}
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                <Business sx={{ fontSize: 18, color: "#6366f1" }} />
                <Typography fontWeight={700} fontSize="0.95rem">
                  Razón Social
                </Typography>
                {form.razon_social_ids.length > 0 && (
                  <Chip
                    label={`${form.razon_social_ids.length} selec.`}
                    size="small"
                    sx={{
                      fontSize: "0.7rem",
                      bgcolor: "rgba(99,102,241,0.1)",
                      color: "#6366f1",
                      fontWeight: 600,
                    }}
                  />
                )}
              </Stack>
              {form.razon_social_ids.length > 0 && (
                <Button
                  size="small"
                  onClick={() =>
                    setForm((prev) => ({ ...prev, razon_social_ids: [] }))
                  }
                  sx={{ fontSize: "0.72rem", color: "#ef4444", minWidth: 0 }}
                >
                  Limpiar
                </Button>
              )}
            </Stack>

            <Paper
              variant="outlined"
              sx={{
                borderRadius: 2,
                overflow: "hidden",
                border: "1px solid #e2e8f0",
              }}
            >
              <Box sx={{ p: 1.5, borderBottom: "1px solid #f0f0f0" }}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="Buscar RS..."
                  value={searchRS}
                  onChange={(e) => setSearchRS(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search
                          sx={{ fontSize: 16, color: "text.secondary" }}
                        />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              {filteredRS.length > 0 && (
                <Box
                  onClick={handleSelectAllRS}
                  sx={{
                    px: 2,
                    py: 1,
                    borderBottom: "1px solid #f0f0f0",
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    cursor: "pointer",
                    bgcolor: "#fafafa",
                    "&:hover": { bgcolor: "#f3f4f6" },
                  }}
                >
                  <Checkbox
                    size="small"
                    checked={allFilteredSelected}
                    indeterminate={someFilteredSelected && !allFilteredSelected}
                    onChange={handleSelectAllRS}
                    onClick={(e) => e.stopPropagation()}
                    sx={{
                      "&.Mui-checked": { color: "#6366f1" },
                      "&.MuiCheckbox-indeterminate": { color: "#6366f1" },
                      p: 0,
                    }}
                  />
                  <Typography
                    fontSize="0.8rem"
                    fontWeight={600}
                    color="text.secondary"
                  >
                    {allFilteredSelected
                      ? "Deseleccionar todas"
                      : "Seleccionar todas"}
                  </Typography>
                </Box>
              )}

              <Box sx={{ maxHeight: 200, overflowY: "auto" }}>
                {filteredRS.length === 0 ? (
                  <Box sx={{ py: 3, textAlign: "center" }}>
                    <Typography fontSize="0.85rem" color="text.secondary">
                      {searchRS ? "No se encontraron RS" : "No hay RS activas"}
                    </Typography>
                  </Box>
                ) : (
                  filteredRS.map((rs) => {
                    const isChecked = form.razon_social_ids.includes(rs.id);
                    return (
                      <Box
                        key={rs.id}
                        onClick={() => handleToggleRS(rs.id)}
                        sx={{
                          px: 2,
                          py: 1,
                          display: "flex",
                          alignItems: "center",
                          gap: 1.5,
                          cursor: "pointer",
                          borderBottom: "1px solid #f5f5f5",
                          bgcolor: isChecked
                            ? "rgba(99,102,241,0.04)"
                            : "transparent",
                          "&:hover": {
                            bgcolor: isChecked
                              ? "rgba(99,102,241,0.07)"
                              : "#f8f9ff",
                          },
                        }}
                      >
                        <Checkbox
                          size="small"
                          checked={isChecked}
                          onChange={() => handleToggleRS(rs.id)}
                          onClick={(e) => e.stopPropagation()}
                          sx={{ "&.Mui-checked": { color: "#6366f1" }, p: 0 }}
                        />
                        <Box
                          sx={{
                            width: 26,
                            height: 26,
                            borderRadius: 1,
                            flexShrink: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            bgcolor: isChecked ? "#6366f1" : "#f1f5f9",
                          }}
                        >
                          <Typography
                            fontSize="0.7rem"
                            fontWeight={700}
                            color={isChecked ? "#fff" : "#9ca3af"}
                          >
                            {rs.name?.[0]?.toUpperCase()}
                          </Typography>
                        </Box>
                        <Typography
                          fontSize="0.85rem"
                          fontWeight={isChecked ? 600 : 400}
                          sx={{ flex: 1 }}
                        >
                          {rs.name}
                        </Typography>
                      </Box>
                    );
                  })
                )}
              </Box>

              {form.razon_social_ids.length > 0 && (
                <Box
                  sx={{
                    px: 2,
                    py: 1,
                    borderTop: "1px solid #f0f0f0",
                    bgcolor: "rgba(99,102,241,0.03)",
                  }}
                >
                  <Stack direction="row" flexWrap="wrap" gap={0.5}>
                    {razones
                      .filter((r) => form.razon_social_ids.includes(r.id))
                      .map((r) => (
                        <Chip
                          key={r.id}
                          label={r.name}
                          size="small"
                          onDelete={() => handleToggleRS(r.id)}
                          sx={{
                            fontSize: "0.7rem",
                            height: 20,
                            bgcolor: "rgba(99,102,241,0.1)",
                            color: "#6366f1",
                          }}
                        />
                      ))}
                  </Stack>
                </Box>
              )}
            </Paper>
          </Paper>
        </Grid>

        {/* ── Emails y Teléfonos ── */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Stack spacing={3}>
            {/* Emails */}
            <Paper sx={{ borderRadius: 3, p: 3 }}>
              <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                <Email sx={{ fontSize: 18, color: "#6366f1" }} />
                <Typography fontWeight={700} fontSize="0.95rem">
                  Correos electrónicos
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} mb={1.5}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="correo@ejemplo.com"
                  value={emailInput}
                  onChange={(e) => {
                    setEmailInput(e.target.value);
                    setEmailError("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleAddEmail()}
                  error={Boolean(emailError)}
                  helperText={emailError}
                />
                <Button
                  variant="outlined"
                  onClick={handleAddEmail}
                  sx={{
                    borderRadius: 2,
                    borderColor: "#e2e8f0",
                    minWidth: 48,
                    color: "#6366f1",
                  }}
                >
                  <Add fontSize="small" />
                </Button>
              </Stack>
              {form.emails.length > 0 && (
                <Stack direction="row" flexWrap="wrap" gap={0.75}>
                  {form.emails.map((email) => (
                    <Chip
                      key={email}
                      label={email}
                      size="small"
                      onDelete={() =>
                        setForm((prev) => ({
                          ...prev,
                          emails: prev.emails.filter((e) => e !== email),
                        }))
                      }
                      sx={{
                        bgcolor: "rgba(99,102,241,0.08)",
                        color: "#6366f1",
                        fontSize: "0.75rem",
                      }}
                    />
                  ))}
                </Stack>
              )}
            </Paper>

            {/* Teléfonos */}
            <Paper sx={{ borderRadius: 3, p: 3 }}>
              <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                <Phone sx={{ fontSize: 18, color: "#6366f1" }} />
                <Typography fontWeight={700} fontSize="0.95rem">
                  Teléfonos
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} mb={1.5}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="+51987654321"
                  value={phoneInput}
                  onChange={(e) => {
                    setPhoneInput(e.target.value);
                    setPhoneError("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleAddPhone()}
                  error={Boolean(phoneError)}
                  helperText={phoneError || "Formato: +51987654321"}
                />
                <Button
                  variant="outlined"
                  onClick={handleAddPhone}
                  sx={{
                    borderRadius: 2,
                    borderColor: "#e2e8f0",
                    minWidth: 48,
                    color: "#6366f1",
                  }}
                >
                  <Add fontSize="small" />
                </Button>
              </Stack>
              {form.phones.length > 0 && (
                <Stack direction="row" flexWrap="wrap" gap={0.75}>
                  {form.phones.map((phone) => (
                    <Chip
                      key={phone}
                      label={phone}
                      size="small"
                      onDelete={() =>
                        setForm((prev) => ({
                          ...prev,
                          phones: prev.phones.filter((p) => p !== phone),
                        }))
                      }
                      sx={{
                        bgcolor: "rgba(16,185,129,0.08)",
                        color: "#10b981",
                        fontSize: "0.75rem",
                      }}
                    />
                  ))}
                </Stack>
              )}
            </Paper>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
