import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  MenuItem,
  Grid,
  Typography,
  IconButton,
  Divider,
  CircularProgress,
  Alert,
} from "@mui/material";
import { Close } from "@mui/icons-material";
import { createUser, updateUser } from "../../api/usersApi";
import { useAuth } from "../../context/AuthContext";

// Roles disponibles según el rol del usuario logueado
const ROLES_BY_ROLE = {
  superadmin: [
    { id: 1, label: "Superadmin" },
    { id: 2, label: "Admin" },
    { id: 3, label: "Supervisor" },
    { id: 4, label: "Usuario" },
  ],
  admin: [
    { id: 3, label: "Supervisor" },
    { id: 4, label: "Usuario" },
  ],
};

const defaultForm = {
  name: "",
  last_name: "",
  username: "",
  password: "",
  role_id: "",
  supervisor_id: null,
  razon_social_ids: [],
  is_active: true,
};

export default function UserFormModal({ open, onClose, user, onSuccess }) {
  const { user: me } = useAuth();
  const isEdit = Boolean(user);
  const availableRoles = ROLES_BY_ROLE[me?.role] || [];

  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        last_name: user.last_name || "",
        username: user.username || "",
        password: "",
        role_id: user.role_id || "",
        supervisor_id: user.supervisor_id || null,
        razon_social_ids: user.razon_social_ids || [],
        is_active: user.is_active ?? true,
      });
    } else {
      setForm(defaultForm);
    }
    setError(null);
  }, [user, open]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      if (isEdit) {
        const payload = {
          name: form.name,
          last_name: form.last_name,
          username: form.username,
          role_id: form.role_id,
          is_active: form.is_active,
          ...(form.password && { password: form.password }),
        };
        await updateUser(user.id, payload);
      } else {
        const payload = {
          name: form.name,
          last_name: form.last_name,
          username: form.username,
          password: form.password,
          role_id: form.role_id,
          supervisor_id: form.supervisor_id || null,
          razon_social_ids: form.razon_social_ids || [],
        };
        await createUser(payload);
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || "Ocurrió un error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
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
        <Typography fontWeight={700} fontSize="1.1rem">
          {isEdit ? "Editar Usuario" : "Nuevo Usuario"}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 2.5 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Nombre"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Apellido"
              name="last_name"
              value={form.last_name}
              onChange={handleChange}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Username"
              name="username"
              value={form.username}
              onChange={handleChange}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              select
              fullWidth
              label="Rol"
              name="role_id"
              value={form.role_id}
              onChange={handleChange}
              required
            >
              {availableRoles.length === 0 ? (
                <MenuItem disabled>Sin roles disponibles</MenuItem>
              ) : (
                availableRoles.map((r) => (
                  <MenuItem key={r.id} value={r.id}>
                    {r.label}
                  </MenuItem>
                ))
              )}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              select
              fullWidth
              label="Estado"
              name="is_active"
              value={form.is_active}
              onChange={(e) =>
                setForm({ ...form, is_active: e.target.value === "true" })
              }
            >
              <MenuItem value="true">Activo</MenuItem>
              <MenuItem value="false">Inactivo</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label={isEdit ? "Nueva contraseña (opcional)" : "Contraseña"}
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required={!isEdit}
              helperText={isEdit ? "Déjalo vacío para no cambiarla" : ""}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          color="inherit"
          sx={{ borderRadius: 2, borderColor: "#e2e8f0" }}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          sx={{
            borderRadius: 2,
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            px: 3,
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
