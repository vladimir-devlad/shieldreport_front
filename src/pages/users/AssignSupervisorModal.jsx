import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  IconButton,
  Divider,
  Button,
  MenuItem,
  TextField,
  CircularProgress,
  Alert,
  Box,
  Avatar,
  Chip,
} from "@mui/material";
import { Close, PersonAdd, PersonRemove } from "@mui/icons-material";
import { getUsers } from "../../api/usersApi";
import { agregarUsuario, removerUsuario } from "../../api/supervisorApi";
import { useAuth } from "../../context/AuthContext";

export default function AssignSupervisorModal({
  open,
  onClose,
  user,
  onSuccess,
}) {
  const { user: me, hasRole } = useAuth();
  const isSupervisor = hasRole("supervisor");

  const [supervisors, setSupervisors] = useState([]);
  const [selectedSupervisorId, setSelectedSupervisorId] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState(null);

  const currentSupervisor = user?.supervisor || null;

  // Carga lista de supervisores (solo para superadmin/admin)
  useEffect(() => {
    if (!open || isSupervisor) return;
    const fetchSupervisors = async () => {
      setFetching(true);
      try {
        const { data } = await getUsers();
        // Filtramos solo usuarios con rol supervisor (role_id: 3)
        setSupervisors(data.filter((u) => u.role_id === 3));
      } catch {
        setError("No se pudieron cargar los supervisores");
      } finally {
        setFetching(false);
      }
    };
    fetchSupervisors();
    setSelectedSupervisorId("");
    setError(null);
  }, [open, isSupervisor]);

  // Asignar supervisor
  const handleAssign = async () => {
    setLoading(true);
    setError(null);
    try {
      // Si es supervisor se asigna a sí mismo
      const supId = isSupervisor ? me.id : selectedSupervisorId;
      await agregarUsuario(supId, user.id);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || "Error al asignar supervisor");
    } finally {
      setLoading(false);
    }
  };

  // Remover supervisor actual
  const handleRemove = async () => {
    if (!currentSupervisor) return;
    setLoading(true);
    setError(null);
    try {
      await removerUsuario(currentSupervisor.id, user.id);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || "Error al remover supervisor");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
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
          Asignar Supervisor
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

        {/* Info del usuario a asignar */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            p: 1.5,
            bgcolor: "#f8fafc",
            borderRadius: 2,
            mb: 2.5,
          }}
        >
          <Avatar
            sx={{
              width: 36,
              height: 36,
              bgcolor: "#6366f1",
              fontSize: "0.875rem",
            }}
          >
            {user.name?.[0]?.toUpperCase()}
          </Avatar>
          <Box>
            <Typography fontSize="0.875rem" fontWeight={600}>
              {user.name} {user.last_name}
            </Typography>
            <Typography fontSize="0.75rem" color="text.secondary">
              @{user.username}
            </Typography>
          </Box>
        </Box>

        {/* Supervisor actual */}
        {currentSupervisor && (
          <Box sx={{ mb: 2.5 }}>
            <Typography fontSize="0.8rem" color="text.secondary" mb={0.75}>
              Supervisor actual
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                p: 1.5,
                border: "1px solid #e2e8f0",
                borderRadius: 2,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Avatar
                  sx={{
                    width: 28,
                    height: 28,
                    bgcolor: "#8b5cf6",
                    fontSize: "0.75rem",
                  }}
                >
                  {currentSupervisor.name?.[0]?.toUpperCase()}
                </Avatar>
                <Typography fontSize="0.875rem" fontWeight={500}>
                  {currentSupervisor.name} {currentSupervisor.last_name}
                </Typography>
              </Box>
              <Chip
                label="Asignado"
                size="small"
                sx={{
                  bgcolor: "rgba(99,102,241,0.1)",
                  color: "#6366f1",
                  fontSize: "0.7rem",
                  fontWeight: 600,
                }}
              />
            </Box>
          </Box>
        )}

        {/* Selector de supervisor — solo para superadmin/admin */}
        {!isSupervisor && (
          <TextField
            select
            fullWidth
            label="Seleccionar supervisor"
            value={selectedSupervisorId}
            onChange={(e) => setSelectedSupervisorId(e.target.value)}
            disabled={fetching}
            size="small"
          >
            {supervisors.length === 0 ? (
              <MenuItem disabled>No hay supervisores disponibles</MenuItem>
            ) : (
              supervisors.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.name} {s.last_name} (@{s.username})
                </MenuItem>
              ))
            )}
          </TextField>
        )}

        {/* Mensaje para supervisor */}
        {isSupervisor && (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            Te asignarás como supervisor de{" "}
            <strong>
              {user.name} {user.last_name}
            </strong>
          </Alert>
        )}
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2, gap: 1, flexWrap: "wrap" }}>
        {/* Remover supervisor actual */}
        {currentSupervisor && !isSupervisor && (
          <Button
            onClick={handleRemove}
            variant="outlined"
            color="error"
            startIcon={<PersonRemove fontSize="small" />}
            disabled={loading}
            sx={{ borderRadius: 2, mr: "auto" }}
          >
            Remover
          </Button>
        )}
        <Button
          onClick={onClose}
          variant="outlined"
          color="inherit"
          sx={{ borderRadius: 2, borderColor: "#e2e8f0" }}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleAssign}
          variant="contained"
          disabled={loading || (!isSupervisor && !selectedSupervisorId)}
          startIcon={loading ? null : <PersonAdd fontSize="small" />}
          sx={{
            borderRadius: 2,
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            px: 2.5,
          }}
        >
          {loading ? (
            <CircularProgress size={20} sx={{ color: "#fff" }} />
          ) : (
            "Asignar"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
