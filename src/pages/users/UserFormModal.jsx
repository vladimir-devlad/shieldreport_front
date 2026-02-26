import {
  Add,
  Business,
  Close,
  Email,
  Phone,
  Search,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { getRazonesSociales } from "../../api/razonSocialApi";
import { getRoles } from "../../api/rolesApi";
import { createUser, updateUser } from "../../api/usersApi";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\+?[1-9]\d{6,14}$/;

const INITIAL_FORM = {
  name: "",
  middle_name: "",
  last_name: "",
  second_last_name: "",
  password: "",
  role_id: "",
  is_active: true,
  razon_social_ids: [],
  emails: [],
  phones: [],
};

export default function UserFormModal({ open, onClose, onSaved, user }) {
  const isEdit = Boolean(user);

  const [form, setForm] = useState(INITIAL_FORM);
  const [roles, setRoles] = useState([]);
  const [razones, setRazones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingCats, setLoadingCats] = useState(true);
  const [error, setError] = useState(null);
  const [showPass, setShowPass] = useState(false);
  const [searchRS, setSearchRS] = useState("");

  const [emailInput, setEmailInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");

  // ── Carga roles y razones sociales ──────────────
  useEffect(() => {
    if (!open) return;
    setLoadingCats(true);
    Promise.all([getRoles(), getRazonesSociales()])
      .then(([{ data: rolesData }, { data: rsData }]) => {
        setRoles(rolesData);
        const allRS = Array.isArray(rsData) ? rsData : (rsData.data ?? []);
        setRazones(allRS.filter((r) => r.is_active));
      })
      .catch(() => {})
      .finally(() => setLoadingCats(false));
  }, [open]);

  // ── Carga datos del usuario al editar ───────────
  useEffect(() => {
    if (!open) return;
    if (isEdit && user) {
      setForm({
        name: user.name ?? "",
        middle_name: user.middle_name ?? "",
        last_name: user.last_name ?? "",
        second_last_name: user.second_last_name ?? "",
        username: user.username ?? "",
        password: "",
        role_id: user.role_id ?? "",
        is_active: user.is_active ?? true,
        razon_social_ids: user.razon_sociales?.map((r) => r.id) ?? [],
        emails: user.emails?.map((e) => e.email ?? e) ?? [],
        phones: user.phones?.map((p) => p.phone_number ?? p) ?? [],
      });
    } else {
      setForm(INITIAL_FORM);
    }
    setError(null);
    setSearchRS("");
    setEmailInput("");
    setPhoneInput("");
    setEmailError("");
    setPhoneError("");
  }, [open, user, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // ── Razón Social con checkbox ────────────────────
  const filteredRS = useMemo(
    () =>
      razones.filter(
        (r) =>
          !searchRS || r.name.toLowerCase().includes(searchRS.toLowerCase()),
      ),
    [razones, searchRS],
  );

  const handleToggleRS = (id) => {
    setForm((prev) => ({
      ...prev,
      razon_social_ids: prev.razon_social_ids.includes(id)
        ? prev.razon_social_ids.filter((x) => x !== id)
        : [...prev.razon_social_ids, id],
    }));
  };

  const handleSelectAllRS = () => {
    const allFilteredIds = filteredRS.map((r) => r.id);
    const allSelected = allFilteredIds.every((id) =>
      form.razon_social_ids.includes(id),
    );
    setForm((prev) => ({
      ...prev,
      razon_social_ids: allSelected
        ? prev.razon_social_ids.filter((id) => !allFilteredIds.includes(id))
        : [...new Set([...prev.razon_social_ids, ...allFilteredIds])],
    }));
  };

  // ── Emails ──────────────────────────────────────
  const handleAddEmail = () => {
    const val = emailInput.trim().toLowerCase();
    if (!val) return;
    if (!emailRegex.test(val)) {
      setEmailError("Email inválido");
      return;
    }
    if (form.emails.includes(val)) {
      setEmailError("Email ya agregado");
      return;
    }
    setForm((prev) => ({ ...prev, emails: [...prev.emails, val] }));
    setEmailInput("");
    setEmailError("");
  };

  const handleRemoveEmail = (email) =>
    setForm((prev) => ({
      ...prev,
      emails: prev.emails.filter((e) => e !== email),
    }));

  // ── Teléfonos ────────────────────────────────────
  const handleAddPhone = () => {
    const val = phoneInput.trim();
    if (!val) return;
    if (!phoneRegex.test(val)) {
      setPhoneError("Formato inválido. Ej: +51987654321");
      return;
    }
    if (form.phones.includes(val)) {
      setPhoneError("Teléfono ya agregado");
      return;
    }
    setForm((prev) => ({ ...prev, phones: [...prev.phones, val] }));
    setPhoneInput("");
    setPhoneError("");
  };

  const handleRemovePhone = (phone) =>
    setForm((prev) => ({
      ...prev,
      phones: prev.phones.filter((p) => p !== phone),
    }));

  // ── Submit ───────────────────────────────────────
  const handleSubmit = async () => {
    setError(null);
    if (!form.name.trim()) return setError("El nombre es obligatorio");
    if (!form.last_name.trim())
      return setError("El apellido paterno es obligatorio");
    if (!isEdit && !form.password)
      return setError("La contraseña es obligatoria");
    if (!form.role_id) return setError("El rol es obligatorio");

    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        last_name: form.last_name.trim(),
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
        ...(isEdit && form.username && { username: form.username }),
      };

      if (isEdit) {
        await updateUser(user.id, payload);
      } else {
        await createUser(payload);
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || "Error al guardar el usuario");
    } finally {
      setLoading(false);
    }
  };

  const allFilteredSelected =
    filteredRS.length > 0 &&
    filteredRS.every((r) => form.razon_social_ids.includes(r.id));
  const someFilteredSelected = filteredRS.some((r) =>
    form.razon_social_ids.includes(r.id),
  );

  return (
    <Dialog
      open={open}
      onClose={() => !loading && onClose()}
      fullWidth
      maxWidth="md"
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pb: 1,
        }}
      >
        <Box>
          <Typography fontWeight={700} fontSize="1.1rem">
            {isEdit ? "Editar usuario" : "Nuevo usuario"}
          </Typography>
          {isEdit && (
            <Typography fontSize="0.78rem" color="text.secondary">
              @{user?.username}
            </Typography>
          )}
        </Box>
        <IconButton size="small" onClick={onClose} disabled={loading}>
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 2.5 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={2.5}>
          {/* ── Datos personales ── */}
          <Grid size={12}>
            <Typography
              fontSize="0.78rem"
              fontWeight={600}
              color="text.secondary"
              textTransform="uppercase"
              letterSpacing={0.5}
            >
              Datos personales
            </Typography>
          </Grid>

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

          {isEdit && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Username"
                name="username"
                value={form.username ?? ""}
                onChange={handleChange}
                helperText="Puedes modificar el username generado automáticamente"
              />
            </Grid>
          )}

          {/* ── Cuenta ── */}
          <Grid size={12}>
            <Divider />
            <Typography
              fontSize="0.78rem"
              fontWeight={600}
              color="text.secondary"
              textTransform="uppercase"
              letterSpacing={0.5}
              mt={1}
            >
              Cuenta
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              size="small"
              label={isEdit ? "Nueva contraseña (opcional)" : "Contraseña *"}
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
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            {loadingCats ? (
              <TextField
                fullWidth
                size="small"
                label="Cargando roles..."
                disabled
              />
            ) : (
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
            )}
          </Grid>

          {isEdit && (
            <Grid size={{ xs: 12, sm: 6 }}>
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
            </Grid>
          )}

          {/* ── Razón Social ── */}
          <Grid size={12}>
            <Divider />
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              mt={1}
              mb={1}
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                <Business sx={{ fontSize: 16, color: "#6366f1" }} />
                <Typography
                  fontSize="0.78rem"
                  fontWeight={600}
                  color="text.secondary"
                  textTransform="uppercase"
                  letterSpacing={0.5}
                >
                  Razón Social
                </Typography>
                {form.razon_social_ids.length > 0 && (
                  <Chip
                    label={`${form.razon_social_ids.length} seleccionada(s)`}
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
                  sx={{
                    fontSize: "0.72rem",
                    color: "#ef4444",
                    minWidth: 0,
                    p: 0.5,
                  }}
                >
                  Limpiar
                </Button>
              )}
            </Stack>
          </Grid>

          <Grid size={12}>
            <Paper
              variant="outlined"
              sx={{
                borderRadius: 2,
                overflow: "hidden",
                border: "1px solid #e2e8f0",
              }}
            >
              {/* Search dentro del panel */}
              <Box sx={{ p: 1.5, borderBottom: "1px solid #f0f0f0" }}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="Buscar razón social..."
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

              {/* Seleccionar todas */}
              {!loadingCats && filteredRS.length > 0 && (
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
                    <Typography
                      component="span"
                      fontSize="0.75rem"
                      color="text.disabled"
                      ml={0.75}
                    >
                      ({filteredRS.length})
                    </Typography>
                  </Typography>
                </Box>
              )}

              {/* Lista RS */}
              <Box sx={{ maxHeight: 220, overflowY: "auto" }}>
                {loadingCats ? (
                  <Box sx={{ p: 2, textAlign: "center" }}>
                    <CircularProgress size={20} sx={{ color: "#6366f1" }} />
                  </Box>
                ) : filteredRS.length === 0 ? (
                  <Box sx={{ py: 3, textAlign: "center" }}>
                    <Typography fontSize="0.85rem" color="text.secondary">
                      {searchRS
                        ? "No se encontraron RS"
                        : "No hay razones sociales activas"}
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
                          transition: "background 0.1s",
                        }}
                      >
                        <Checkbox
                          size="small"
                          checked={isChecked}
                          onChange={() => handleToggleRS(rs.id)}
                          onClick={(e) => e.stopPropagation()}
                          sx={{
                            "&.Mui-checked": { color: "#6366f1" },
                            p: 0,
                            flexShrink: 0,
                          }}
                        />
                        <Box
                          sx={{
                            width: 28,
                            height: 28,
                            borderRadius: 1,
                            flexShrink: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            bgcolor: isChecked ? "#6366f1" : "#f1f5f9",
                            transition: "background 0.15s",
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
                        {isChecked && (
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              bgcolor: "#6366f1",
                              flexShrink: 0,
                            }}
                          />
                        )}
                      </Box>
                    );
                  })
                )}
              </Box>

              {/* Footer contador */}
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
          </Grid>

          {/* ── Emails ── */}
          <Grid size={12}>
            <Divider />
            <Typography
              fontSize="0.78rem"
              fontWeight={600}
              color="text.secondary"
              textTransform="uppercase"
              letterSpacing={0.5}
              mt={1}
            >
              Correos electrónicos
            </Typography>
          </Grid>

          <Grid size={12}>
            <Stack direction="row" spacing={1}>
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
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email sx={{ fontSize: 16, color: "text.secondary" }} />
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                variant="outlined"
                onClick={handleAddEmail}
                sx={{
                  borderRadius: 2,
                  borderColor: "#e2e8f0",
                  minWidth: 56,
                  color: "#6366f1",
                  "&:hover": { borderColor: "#6366f1" },
                }}
              >
                <Add fontSize="small" />
              </Button>
            </Stack>
            {form.emails.length > 0 && (
              <Stack direction="row" flexWrap="wrap" gap={0.75} mt={1.25}>
                {form.emails.map((email) => (
                  <Chip
                    key={email}
                    label={email}
                    size="small"
                    onDelete={() => handleRemoveEmail(email)}
                    sx={{
                      bgcolor: "rgba(99,102,241,0.08)",
                      color: "#6366f1",
                      fontSize: "0.75rem",
                    }}
                  />
                ))}
              </Stack>
            )}
          </Grid>

          {/* ── Teléfonos ── */}
          <Grid size={12}>
            <Divider />
            <Typography
              fontSize="0.78rem"
              fontWeight={600}
              color="text.secondary"
              textTransform="uppercase"
              letterSpacing={0.5}
              mt={1}
            >
              Teléfonos
            </Typography>
          </Grid>

          <Grid size={12}>
            <Stack direction="row" spacing={1}>
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
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Phone sx={{ fontSize: 16, color: "text.secondary" }} />
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                variant="outlined"
                onClick={handleAddPhone}
                sx={{
                  borderRadius: 2,
                  borderColor: "#e2e8f0",
                  minWidth: 56,
                  color: "#6366f1",
                  "&:hover": { borderColor: "#6366f1" },
                }}
              >
                <Add fontSize="small" />
              </Button>
            </Stack>
            {form.phones.length > 0 && (
              <Stack direction="row" flexWrap="wrap" gap={0.75} mt={1.25}>
                {form.phones.map((phone) => (
                  <Chip
                    key={phone}
                    label={phone}
                    size="small"
                    onDelete={() => handleRemovePhone(phone)}
                    sx={{
                      bgcolor: "rgba(16,185,129,0.08)",
                      color: "#10b981",
                      fontSize: "0.75rem",
                    }}
                  />
                ))}
              </Stack>
            )}
          </Grid>
        </Grid>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          color="inherit"
          disabled={loading}
          sx={{ borderRadius: 2, borderColor: "#e2e8f0" }}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || loadingCats}
          sx={{
            borderRadius: 2,
            px: 3,
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
          }}
        >
          {loading ? (
            <CircularProgress size={20} sx={{ color: "#fff" }} />
          ) : isEdit ? (
            "Guardar cambios"
          ) : (
            "Crear usuario"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
