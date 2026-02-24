import { BarChart, Close, Group, PersonAdd, Search } from "@mui/icons-material";
import {
  Alert,
  Avatar,
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
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { agregarUsuario } from "../../api/supervisorApi";
import { getUserMe, getUsersSinSuper } from "../../api/usersApi";
import { useAuth } from "../../context/AuthContext";

// ── Fuera del componente para no recrearse en cada render ──
const fetchAllSinSupervisor = async () => {
  const limit = 100;
  let page = 1;
  let all = [];
  let hasMore = true;

  while (hasMore) {
    const { data } = await getUsersSinSuper({ page, limit });
    const items = data.data ?? []; // ← aquí estaba el bug, era data.items
    all = [...all, ...items];
    hasMore = all.length < data.total; // ← usamos total para saber si hay más
    page++;
  }
  return all;
};

export default function MiGrupoView() {
  const { user: me } = useAuth();
  const navigate = useNavigate();

  const [myData, setMyData] = useState(null);
  const [sinSupervisor, setSinSupervisor] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assignDialog, setAssignDialog] = useState(false);
  const [searchAssign, setSearchAssign] = useState("");
  const [selected, setSelected] = useState([]);
  const [assigning, setAssigning] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [{ data: userData }, sinSup] = await Promise.all([
        getUserMe(),
        fetchAllSinSupervisor(),
      ]);
      console.log("sinSupervisor total:", sinSup.length);
      setMyData(userData);
      setSinSupervisor(sinSup);
    } catch (err) {
      console.error("Error fetchData:", err);
      setError("No se pudieron cargar los datos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenDialog = () => {
    setSelected([]);
    setSearchAssign("");
    setAssignDialog(true);
  };

  const handleCloseDialog = () => {
    if (assigning) return;
    setAssignDialog(false);
    setSelected([]);
    setSearchAssign("");
  };

  const handleToggleSelect = (userId) => {
    setSelected((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const handleSelectAll = (filteredList) => {
    const allIds = filteredList.map((u) => u.id);
    const allSelected = allIds.every((id) => selected.includes(id));
    setSelected(allSelected ? [] : allIds);
  };

  const handleAsignarme = async () => {
    if (!selected.length) return;
    setAssigning(true);
    try {
      await Promise.all(
        selected.map((userId) => agregarUsuario(me.id, userId)),
      );
      await fetchData();
      handleCloseDialog();
    } catch {
      setError("No se pudieron asignar algunos usuarios");
    } finally {
      setAssigning(false);
    }
  };

  const filteredSinSup = sinSupervisor.filter(
    (u) =>
      !searchAssign ||
      `${u.name} ${u.last_name}`
        .toLowerCase()
        .includes(searchAssign.toLowerCase()) ||
      u.username.toLowerCase().includes(searchAssign.toLowerCase()),
  );

  const usuarios = myData?.supervised_users ?? [];

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          Mi Grupo
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={0.25}>
          Usuarios asignados a tu supervisión
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* Mi info */}
      <Paper
        sx={{
          p: 2.5,
          mb: 3,
          borderRadius: 3,
          background:
            "linear-gradient(135deg, rgba(99,102,241,0.06), rgba(139,92,246,0.06))",
          border: "1px solid rgba(99,102,241,0.15)",
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar
            sx={{
              width: 48,
              height: 48,
              fontWeight: 700,
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            }}
          >
            {myData?.name?.[0]?.toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography fontWeight={700}>
              {myData?.name} {myData?.last_name}
            </Typography>
            <Typography fontSize="0.8rem" color="text.secondary">
              @{myData?.username}
            </Typography>
          </Box>
          <Stack alignItems="center">
            <Typography fontWeight={700} fontSize="1.8rem" color="#6366f1">
              {loading ? <Skeleton width={40} /> : usuarios.length}
            </Typography>
            <Typography fontSize="0.7rem" color="text.secondary">
              usuarios
            </Typography>
          </Stack>
        </Stack>
      </Paper>

      {/* Acciones */}
      <Stack direction="row" spacing={2} mb={3}>
        <Button
          variant="contained"
          startIcon={<PersonAdd />}
          disabled={loading || sinSupervisor.length === 0}
          onClick={handleOpenDialog}
          sx={{
            borderRadius: 2,
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
          }}
        >
          {loading
            ? "Cargando..."
            : sinSupervisor.length === 0
              ? "No hay usuarios libres"
              : `Asignarme usuarios (${sinSupervisor.length} disponibles)`}
        </Button>
        <Button
          variant="outlined"
          startIcon={<BarChart />}
          onClick={() => navigate("/reportes")}
          sx={{
            borderRadius: 2,
            borderColor: "#e2e8f0",
            color: "text.secondary",
          }}
        >
          Ver reportes del grupo
        </Button>
      </Stack>

      {/* Lista usuarios del grupo */}
      <Paper sx={{ borderRadius: 3, overflow: "hidden" }}>
        <Box
          sx={{
            px: 2.5,
            py: 2,
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Group sx={{ color: "#6366f1", fontSize: 20 }} />
          <Typography fontWeight={600}>Usuarios de mi grupo</Typography>
        </Box>

        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Box key={i} sx={{ px: 2.5, py: 1.5 }}>
              <Skeleton variant="text" width="40%" />
              <Skeleton variant="text" width="20%" />
            </Box>
          ))
        ) : usuarios.length === 0 ? (
          <Box sx={{ py: 5, textAlign: "center" }}>
            <Typography color="text.secondary" fontSize="0.9rem">
              Aún no tienes usuarios asignados
            </Typography>
            <Typography color="text.secondary" fontSize="0.8rem" mt={0.5}>
              Usa el botón de arriba para asignarte usuarios disponibles
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {usuarios.map((u, idx) => (
              <Box key={u.id}>
                <ListItem sx={{ px: 2.5, py: 1.5 }}>
                  <ListItemAvatar>
                    <Avatar
                      sx={{
                        width: 38,
                        height: 38,
                        fontSize: "0.85rem",
                        bgcolor: u.is_active
                          ? "rgba(99,102,241,0.1)"
                          : "#f1f5f9",
                        color: u.is_active ? "#6366f1" : "#9ca3af",
                      }}
                    >
                      {u.name?.[0]?.toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography fontSize="0.9rem" fontWeight={600}>
                          {u.name} {u.last_name}
                        </Typography>
                        <Chip
                          label={u.is_active ? "Activo" : "Inactivo"}
                          size="small"
                          sx={{
                            fontSize: "0.65rem",
                            height: 18,
                            fontWeight: 600,
                            bgcolor: u.is_active
                              ? "rgba(16,185,129,0.1)"
                              : "rgba(156,163,175,0.15)",
                            color: u.is_active ? "#10b981" : "#9ca3af",
                          }}
                        />
                      </Stack>
                    }
                    secondary={
                      <Box>
                        <Typography fontSize="0.75rem" color="text.secondary">
                          @{u.username}
                        </Typography>
                        {u.razon_sociales?.length > 0 && (
                          <Stack
                            direction="row"
                            spacing={0.5}
                            mt={0.75}
                            flexWrap="wrap"
                          >
                            {u.razon_sociales.map((rs) => (
                              <Chip
                                key={rs.id}
                                label={rs.name}
                                size="small"
                                sx={{
                                  fontSize: "0.65rem",
                                  height: 18,
                                  bgcolor: "rgba(99,102,241,0.07)",
                                  color: "#6366f1",
                                }}
                              />
                            ))}
                          </Stack>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
                {idx < usuarios.length - 1 && <Divider sx={{ ml: 9 }} />}
              </Box>
            ))}
          </List>
        )}
      </Paper>

      {/* ── Dialog asignarme con checkbox ── */}
      <Dialog
        open={assignDialog}
        onClose={handleCloseDialog}
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
          <Box>
            <Typography fontWeight={700}>Asignarme usuarios</Typography>
            <Typography fontSize="0.78rem" color="text.secondary">
              Selecciona los usuarios que deseas agregar a tu grupo
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={handleCloseDialog}
            disabled={assigning}
          >
            <Close fontSize="small" />
          </IconButton>
        </DialogTitle>

        <Divider />

        {/* Search */}
        <Box sx={{ px: 2.5, py: 1.5, borderBottom: "1px solid #f0f0f0" }}>
          <TextField
            size="small"
            fullWidth
            placeholder="Buscar usuario..."
            value={searchAssign}
            onChange={(e) => setSearchAssign(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ fontSize: 18, color: "text.secondary" }} />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {/* Seleccionar todos */}
        {filteredSinSup.length > 0 && (
          <Box
            sx={{
              px: 2.5,
              py: 1,
              borderBottom: "1px solid #f0f0f0",
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Checkbox
              size="small"
              checked={filteredSinSup.every((u) => selected.includes(u.id))}
              indeterminate={
                filteredSinSup.some((u) => selected.includes(u.id)) &&
                !filteredSinSup.every((u) => selected.includes(u.id))
              }
              onChange={() => handleSelectAll(filteredSinSup)}
              sx={{
                "&.Mui-checked": { color: "#6366f1" },
                "&.MuiCheckbox-indeterminate": { color: "#6366f1" },
                p: 0,
              }}
            />
            <Typography fontSize="0.8rem" color="text.secondary">
              {selected.length > 0
                ? `${selected.length} seleccionado(s)`
                : "Seleccionar todos"}
            </Typography>
          </Box>
        )}

        <DialogContent sx={{ p: 0, maxHeight: 380, overflowY: "auto" }}>
          {filteredSinSup.length === 0 ? (
            <Box sx={{ py: 4, textAlign: "center" }}>
              <Typography color="text.secondary" fontSize="0.9rem">
                {searchAssign
                  ? "No se encontraron usuarios"
                  : "No hay usuarios libres disponibles"}
              </Typography>
            </Box>
          ) : (
            <List disablePadding>
              {filteredSinSup.map((u, idx) => (
                <Box key={u.id}>
                  <ListItemButton
                    onClick={() => handleToggleSelect(u.id)}
                    sx={{
                      px: 2.5,
                      py: 1.25,
                      bgcolor: selected.includes(u.id)
                        ? "rgba(99,102,241,0.04)"
                        : "transparent",
                      "&:hover": { bgcolor: "rgba(99,102,241,0.06)" },
                    }}
                  >
                    <Checkbox
                      size="small"
                      checked={selected.includes(u.id)}
                      onChange={() => handleToggleSelect(u.id)}
                      onClick={(e) => e.stopPropagation()}
                      sx={{
                        "&.Mui-checked": { color: "#6366f1" },
                        mr: 1,
                        p: 0,
                      }}
                    />
                    <ListItemAvatar sx={{ minWidth: 44 }}>
                      <Avatar
                        sx={{
                          width: 34,
                          height: 34,
                          fontSize: "0.8rem",
                          bgcolor: selected.includes(u.id)
                            ? "#6366f1"
                            : "#e2e8f0",
                          color: selected.includes(u.id) ? "#fff" : "#6b7280",
                        }}
                      >
                        {u.name?.[0]?.toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography fontSize="0.875rem" fontWeight={500}>
                          {u.name} {u.last_name}
                        </Typography>
                      }
                      secondary={
                        <Typography fontSize="0.75rem" color="text.secondary">
                          @{u.username}
                        </Typography>
                      }
                    />
                  </ListItemButton>
                  {idx < filteredSinSup.length - 1 && <Divider />}
                </Box>
              ))}
            </List>
          )}
        </DialogContent>

        <Divider />

        <DialogActions sx={{ px: 2.5, py: 2, gap: 1 }}>
          <Typography
            fontSize="0.8rem"
            color="text.secondary"
            sx={{ mr: "auto" }}
          >
            {sinSupervisor.length} usuario(s) disponible(s)
          </Typography>
          <Button
            onClick={handleCloseDialog}
            variant="outlined"
            color="inherit"
            disabled={assigning}
            sx={{ borderRadius: 2, borderColor: "#e2e8f0" }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleAsignarme}
            variant="contained"
            disabled={assigning || selected.length === 0}
            sx={{
              borderRadius: 2,
              px: 3,
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            }}
          >
            {assigning ? (
              <CircularProgress size={20} sx={{ color: "#fff" }} />
            ) : (
              `Asignarme ${selected.length > 0 ? `(${selected.length})` : ""}`
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
