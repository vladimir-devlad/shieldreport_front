import {
  ArrowBack,
  Business,
  CheckCircle,
  ChevronRight,
  Person,
  Refresh,
  Search,
} from "@mui/icons-material";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  IconButton,
  InputAdornment,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  assignRazonSocial,
  getRazonesSociales,
  removeRazonSocial,
} from "../../api/razonSocialApi";
import { getUsers } from "../../api/usersApi";
import { useAuth } from "../../context/AuthContext";

export default function AsignarRazonSocialPage() {
  const navigate = useNavigate();
  const { hasRole, user: me } = useAuth();

  // ── Datos ────────────────────────────────────────
  const [razones, setRazones] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // ── Selección ────────────────────────────────────
  const [selectedRS, setSelectedRS] = useState([]); // ids de RS seleccionadas
  const [selectedUsers, setSelectedUsers] = useState([]); // ids de usuarios seleccionados

  // ── Búsqueda ─────────────────────────────────────
  const [searchRS, setSearchRS] = useState("");
  const [searchUser, setSearchUser] = useState("");

  // ── Mapa de asignaciones actuales ────────────────
  // { userId: [rsId, rsId, ...] }
  const [assignMap, setAssignMap] = useState({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [{ data: rsData }, { data: usersData }] = await Promise.all([
        getRazonesSociales(),
        getUsers(),
      ]);

      // Superadmin ve todas las RS, Admin y Supervisor solo activas
      const allRS = Array.isArray(rsData) ? rsData : (rsData.data ?? []);
      const filteredRS = hasRole("superadmin")
        ? allRS
        : allRS.filter((r) => r.is_active);

      // Usuarios: supervisor solo ve sus usuarios
      const allUsers = Array.isArray(usersData)
        ? usersData
        : (usersData.data ?? []);
      const filteredUsers =
        hasRole("supervisor") && !hasRole("superadmin", "admin")
          ? allUsers.filter((u) => u.supervisor?.id === me.id)
          : allUsers;

      setRazones(filteredRS);
      setUsers(filteredUsers);

      // Construimos el mapa de asignaciones
      const map = {};
      filteredUsers.forEach((u) => {
        map[u.id] = u.razon_sociales?.map((r) => r.id) ?? [];
      });
      setAssignMap(map);
    } catch {
      setError("No se pudieron cargar los datos");
    } finally {
      setLoading(false);
    }
  }, [hasRole, me]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Helpers selección RS ─────────────────────────
  const handleToggleRS = (id) => {
    setSelectedRS((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleSelectAllRS = (list) => {
    const allIds = list.map((r) => r.id);
    const allSelected = allIds.every((id) => selectedRS.includes(id));
    setSelectedRS(allSelected ? [] : allIds);
  };

  // ── Helpers selección usuarios ───────────────────
  const handleToggleUser = (id) => {
    setSelectedUsers((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleSelectAllUsers = (list) => {
    const allIds = list.map((u) => u.id);
    const allSelected = allIds.every((id) => selectedUsers.includes(id));
    setSelectedUsers(allSelected ? [] : allIds);
  };

  // ── Verificar si un usuario tiene TODAS las RS seleccionadas ──
  const userHasAllSelectedRS = (userId) =>
    selectedRS.length > 0 &&
    selectedRS.every((rsId) => (assignMap[userId] ?? []).includes(rsId));

  const userHasSomeSelectedRS = (userId) =>
    selectedRS.some((rsId) => (assignMap[userId] ?? []).includes(rsId));

  // ── Asignar ──────────────────────────────────────
  const handleAsignar = async () => {
    if (!selectedRS.length || !selectedUsers.length) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await Promise.all(
        selectedUsers.map((userId) =>
          assignRazonSocial({ user_id: userId, razon_social_ids: selectedRS }),
        ),
      );
      // Actualizamos mapa local
      setAssignMap((prev) => {
        const next = { ...prev };
        selectedUsers.forEach((uid) => {
          const current = new Set(next[uid] ?? []);
          selectedRS.forEach((rsId) => current.add(rsId));
          next[uid] = [...current];
        });
        return next;
      });
      setSuccess(
        `RS asignadas correctamente a ${selectedUsers.length} usuario(s)`,
      );
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError("Error al asignar razones sociales");
    } finally {
      setSaving(false);
    }
  };

  // ── Desasignar ───────────────────────────────────
  const handleDesasignar = async () => {
    if (!selectedRS.length || !selectedUsers.length) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await Promise.all(
        selectedUsers.flatMap((userId) =>
          selectedRS.map((rsId) => removeRazonSocial(userId, rsId)),
        ),
      );
      // Actualizamos mapa local
      setAssignMap((prev) => {
        const next = { ...prev };
        selectedUsers.forEach((uid) => {
          next[uid] = (next[uid] ?? []).filter(
            (rsId) => !selectedRS.includes(rsId),
          );
        });
        return next;
      });
      setSuccess(
        `RS desasignadas correctamente de ${selectedUsers.length} usuario(s)`,
      );
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError("Error al desasignar razones sociales");
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle rápido en un usuario específico ───────
  const handleQuickToggle = async (userId, rsId) => {
    const tiene = (assignMap[userId] ?? []).includes(rsId);
    setSaving(true);
    try {
      if (tiene) {
        await removeRazonSocial(userId, rsId);
        setAssignMap((prev) => ({
          ...prev,
          [userId]: (prev[userId] ?? []).filter((id) => id !== rsId),
        }));
      } else {
        await assignRazonSocial({ user_id: userId, razon_social_ids: [rsId] });
        setAssignMap((prev) => ({
          ...prev,
          [userId]: [...(prev[userId] ?? []), rsId],
        }));
      }
    } catch {
      setError("Error al actualizar la asignación");
    } finally {
      setSaving(false);
    }
  };

  // ── Filtros ──────────────────────────────────────
  const filteredRS = razones.filter(
    (r) => !searchRS || r.name.toLowerCase().includes(searchRS.toLowerCase()),
  );

  const filteredUsers = users.filter(
    (u) =>
      !searchUser ||
      `${u.name} ${u.last_name}`
        .toLowerCase()
        .includes(searchUser.toLowerCase()) ||
      u.username?.toLowerCase().includes(searchUser.toLowerCase()),
  );

  const canAssign = selectedRS.length > 0 && selectedUsers.length > 0;

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={2} mb={3}>
        <Tooltip title="Volver">
          <IconButton
            onClick={() => navigate("/razon-social")}
            sx={{ border: "1px solid #e2e8f0", borderRadius: 2 }}
          >
            <ArrowBack fontSize="small" />
          </IconButton>
        </Tooltip>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" fontWeight={700}>
            Asignar Razón Social
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.25}>
            Selecciona las RS y los usuarios a asignar
          </Typography>
        </Box>
        <Tooltip title="Refrescar">
          <IconButton
            onClick={fetchData}
            sx={{ border: "1px solid #e2e8f0", borderRadius: 2 }}
          >
            <Refresh fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
          {success}
        </Alert>
      )}

      {/* Barra de acciones */}
      {canAssign && (
        <Paper
          sx={{
            p: 2,
            mb: 2.5,
            borderRadius: 3,
            bgcolor: "rgba(99,102,241,0.04)",
            border: "1px solid rgba(99,102,241,0.15)",
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={2}
            flexWrap="wrap"
          >
            <Box>
              <Typography fontSize="0.85rem" fontWeight={600} color="#6366f1">
                {selectedRS.length} RS · {selectedUsers.length} usuario(s)
                seleccionados
              </Typography>
              <Typography fontSize="0.75rem" color="text.secondary">
                ¿Qué acción quieres aplicar?
              </Typography>
            </Box>
            <Stack direction="row" spacing={1.5} sx={{ ml: "auto" }}>
              <Button
                variant="contained"
                disabled={saving}
                onClick={handleAsignar}
                sx={{
                  borderRadius: 2,
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  px: 3,
                }}
              >
                {saving ? (
                  <CircularProgress size={18} sx={{ color: "#fff" }} />
                ) : (
                  "Asignar"
                )}
              </Button>
              <Button
                variant="outlined"
                disabled={saving}
                onClick={handleDesasignar}
                sx={{
                  borderRadius: 2,
                  borderColor: "#ef4444",
                  color: "#ef4444",
                  px: 3,
                  "&:hover": {
                    bgcolor: "rgba(239,68,68,0.06)",
                    borderColor: "#ef4444",
                  },
                }}
              >
                {saving ? <CircularProgress size={18} /> : "Desasignar"}
              </Button>
            </Stack>
          </Stack>
        </Paper>
      )}

      {/* Vista de dos columnas */}
      <Stack direction={{ xs: "column", md: "row" }} spacing={2.5}>
        {/* ── Columna izquierda: Razones Sociales ── */}
        <Paper sx={{ borderRadius: 3, overflow: "hidden", flex: "0 0 340px" }}>
          {/* Header columna */}
          <Box
            sx={{
              px: 2.5,
              py: 2,
              borderBottom: "1px solid #e2e8f0",
              bgcolor: "#f8fafc",
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
              <Business sx={{ color: "#6366f1", fontSize: 20 }} />
              <Typography fontWeight={600} fontSize="0.95rem">
                Razones Sociales
              </Typography>
              <Chip
                label={
                  selectedRS.length > 0
                    ? `${selectedRS.length} selec.`
                    : razones.length
                }
                size="small"
                sx={{
                  ml: "auto",
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  bgcolor:
                    selectedRS.length > 0 ? "rgba(99,102,241,0.1)" : "#f1f5f9",
                  color: selectedRS.length > 0 ? "#6366f1" : "text.secondary",
                }}
              />
            </Stack>
            <TextField
              size="small"
              fullWidth
              placeholder="Buscar RS..."
              value={searchRS}
              onChange={(e) => setSearchRS(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ fontSize: 16, color: "text.secondary" }} />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {/* Seleccionar todas */}
          {!loading && filteredRS.length > 0 && (
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
                checked={filteredRS.every((r) => selectedRS.includes(r.id))}
                indeterminate={
                  filteredRS.some((r) => selectedRS.includes(r.id)) &&
                  !filteredRS.every((r) => selectedRS.includes(r.id))
                }
                onChange={() => handleSelectAllRS(filteredRS)}
                sx={{
                  "&.Mui-checked": { color: "#6366f1" },
                  "&.MuiCheckbox-indeterminate": { color: "#6366f1" },
                  p: 0,
                }}
              />
              <Typography fontSize="0.78rem" color="text.secondary">
                {selectedRS.length > 0
                  ? `${selectedRS.length} seleccionada(s)`
                  : "Seleccionar todas"}
              </Typography>
            </Box>
          )}

          {/* Lista RS */}
          <Box sx={{ maxHeight: "calc(100vh - 380px)", overflowY: "auto" }}>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Box
                  key={i}
                  sx={{ px: 2.5, py: 1.5, borderBottom: "1px solid #f5f5f5" }}
                >
                  <Skeleton variant="text" width="70%" />
                </Box>
              ))
            ) : filteredRS.length === 0 ? (
              <Box sx={{ py: 4, textAlign: "center" }}>
                <Typography fontSize="0.85rem" color="text.secondary">
                  No hay RS disponibles
                </Typography>
              </Box>
            ) : (
              filteredRS.map((rs) => {
                const isSelected = selectedRS.includes(rs.id);
                return (
                  <Box
                    key={rs.id}
                    onClick={() => handleToggleRS(rs.id)}
                    sx={{
                      px: 2.5,
                      py: 1.5,
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      cursor: "pointer",
                      borderBottom: "1px solid #f5f5f5",
                      bgcolor: isSelected
                        ? "rgba(99,102,241,0.05)"
                        : "transparent",
                      "&:hover": {
                        bgcolor: isSelected
                          ? "rgba(99,102,241,0.08)"
                          : "#f8f9ff",
                      },
                      transition: "background 0.15s",
                    }}
                  >
                    <Checkbox
                      size="small"
                      checked={isSelected}
                      onChange={() => handleToggleRS(rs.id)}
                      onClick={(e) => e.stopPropagation()}
                      sx={{ "&.Mui-checked": { color: "#6366f1" }, p: 0 }}
                    />
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: 1.5,
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: isSelected ? "#6366f1" : "#f1f5f9",
                        transition: "background 0.15s",
                      }}
                    >
                      <Typography
                        fontSize="0.75rem"
                        fontWeight={700}
                        color={isSelected ? "#fff" : "#9ca3af"}
                      >
                        {rs.name?.[0]?.toUpperCase()}
                      </Typography>
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        fontSize="0.875rem"
                        fontWeight={isSelected ? 600 : 400}
                        noWrap
                      >
                        {rs.name}
                      </Typography>
                      <Chip
                        label={rs.is_active ? "Activa" : "Inactiva"}
                        size="small"
                        sx={{
                          fontSize: "0.6rem",
                          height: 16,
                          fontWeight: 600,
                          bgcolor: rs.is_active
                            ? "rgba(16,185,129,0.1)"
                            : "rgba(156,163,175,0.15)",
                          color: rs.is_active ? "#10b981" : "#9ca3af",
                        }}
                      />
                    </Box>
                    {isSelected && (
                      <CheckCircle
                        sx={{ color: "#6366f1", fontSize: 18, flexShrink: 0 }}
                      />
                    )}
                  </Box>
                );
              })
            )}
          </Box>
        </Paper>

        {/* ── Indicador central ── */}
        <Stack
          alignItems="center"
          justifyContent="center"
          sx={{ display: { xs: "none", md: "flex" } }}
        >
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              bgcolor: canAssign ? "#6366f1" : "#e2e8f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 0.2s",
            }}
          >
            <ChevronRight sx={{ color: canAssign ? "#fff" : "#9ca3af" }} />
          </Box>
        </Stack>

        {/* ── Columna derecha: Usuarios ── */}
        <Paper sx={{ borderRadius: 3, overflow: "hidden", flex: 1 }}>
          {/* Header columna */}
          <Box
            sx={{
              px: 2.5,
              py: 2,
              borderBottom: "1px solid #e2e8f0",
              bgcolor: "#f8fafc",
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
              <Person sx={{ color: "#6366f1", fontSize: 20 }} />
              <Typography fontWeight={600} fontSize="0.95rem">
                Usuarios
              </Typography>
              <Chip
                label={
                  selectedUsers.length > 0
                    ? `${selectedUsers.length} selec.`
                    : users.length
                }
                size="small"
                sx={{
                  ml: "auto",
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  bgcolor:
                    selectedUsers.length > 0
                      ? "rgba(99,102,241,0.1)"
                      : "#f1f5f9",
                  color:
                    selectedUsers.length > 0 ? "#6366f1" : "text.secondary",
                }}
              />
            </Stack>
            <TextField
              size="small"
              fullWidth
              placeholder="Buscar usuario..."
              value={searchUser}
              onChange={(e) => setSearchUser(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ fontSize: 16, color: "text.secondary" }} />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {/* Seleccionar todos */}
          {!loading && filteredUsers.length > 0 && (
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
                checked={filteredUsers.every((u) =>
                  selectedUsers.includes(u.id),
                )}
                indeterminate={
                  filteredUsers.some((u) => selectedUsers.includes(u.id)) &&
                  !filteredUsers.every((u) => selectedUsers.includes(u.id))
                }
                onChange={() => handleSelectAllUsers(filteredUsers)}
                sx={{
                  "&.Mui-checked": { color: "#6366f1" },
                  "&.MuiCheckbox-indeterminate": { color: "#6366f1" },
                  p: 0,
                }}
              />
              <Typography fontSize="0.78rem" color="text.secondary">
                {selectedUsers.length > 0
                  ? `${selectedUsers.length} seleccionado(s)`
                  : "Seleccionar todos"}
              </Typography>
            </Box>
          )}

          {/* Lista usuarios */}
          <Box sx={{ maxHeight: "calc(100vh - 380px)", overflowY: "auto" }}>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Box
                  key={i}
                  sx={{ px: 2.5, py: 1.5, borderBottom: "1px solid #f5f5f5" }}
                >
                  <Skeleton variant="text" width="50%" />
                  <Skeleton variant="text" width="30%" />
                </Box>
              ))
            ) : filteredUsers.length === 0 ? (
              <Box sx={{ py: 4, textAlign: "center" }}>
                <Typography fontSize="0.85rem" color="text.secondary">
                  No hay usuarios disponibles
                </Typography>
              </Box>
            ) : (
              filteredUsers.map((u) => {
                const isSelected = selectedUsers.includes(u.id);
                const userRS = assignMap[u.id] ?? [];
                const hasAll = userHasAllSelectedRS(u.id);
                const hasSome = userHasSomeSelectedRS(u.id);
                const rsAsignadas = razones.filter((r) =>
                  userRS.includes(r.id),
                );

                return (
                  <Box
                    key={u.id}
                    onClick={() => handleToggleUser(u.id)}
                    sx={{
                      px: 2.5,
                      py: 1.5,
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 1.5,
                      cursor: "pointer",
                      borderBottom: "1px solid #f5f5f5",
                      bgcolor: isSelected
                        ? "rgba(99,102,241,0.05)"
                        : "transparent",
                      "&:hover": {
                        bgcolor: isSelected
                          ? "rgba(99,102,241,0.08)"
                          : "#f8f9ff",
                      },
                      transition: "background 0.15s",
                    }}
                  >
                    <Checkbox
                      size="small"
                      checked={isSelected}
                      onChange={() => handleToggleUser(u.id)}
                      onClick={(e) => e.stopPropagation()}
                      sx={{
                        "&.Mui-checked": { color: "#6366f1" },
                        p: 0,
                        mt: 0.5,
                      }}
                    />
                    <Avatar
                      sx={{
                        width: 34,
                        height: 34,
                        fontSize: "0.8rem",
                        flexShrink: 0,
                        bgcolor: isSelected
                          ? "#6366f1"
                          : "rgba(99,102,241,0.1)",
                        color: isSelected ? "#fff" : "#6366f1",
                      }}
                    >
                      {u.name?.[0]?.toUpperCase()}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography
                          fontSize="0.875rem"
                          fontWeight={isSelected ? 600 : 500}
                          noWrap
                        >
                          {u.name} {u.last_name}
                        </Typography>
                        <Typography fontSize="0.75rem" color="text.secondary">
                          @{u.username}
                        </Typography>
                        {/* Indicador de estado de asignación */}
                        {selectedRS.length > 0 && (
                          <Chip
                            label={
                              hasAll
                                ? "Todo asignado"
                                : hasSome
                                  ? "Parcial"
                                  : "Sin asignar"
                            }
                            size="small"
                            sx={{
                              fontSize: "0.6rem",
                              height: 16,
                              fontWeight: 600,
                              ml: "auto",
                              bgcolor: hasAll
                                ? "rgba(16,185,129,0.1)"
                                : hasSome
                                  ? "rgba(245,158,11,0.1)"
                                  : "rgba(156,163,175,0.1)",
                              color: hasAll
                                ? "#10b981"
                                : hasSome
                                  ? "#f59e0b"
                                  : "#9ca3af",
                            }}
                          />
                        )}
                      </Stack>

                      {/* RS asignadas al usuario */}
                      {rsAsignadas.length > 0 && (
                        <Stack
                          direction="row"
                          flexWrap="wrap"
                          gap={0.5}
                          mt={0.75}
                        >
                          {rsAsignadas.map((rs) => (
                            <Tooltip
                              key={rs.id}
                              title={
                                selectedRS.length === 1
                                  ? assignMap[u.id]?.includes(selectedRS[0])
                                    ? "Click para desasignar"
                                    : "Click para asignar"
                                  : rs.name
                              }
                            >
                              <Chip
                                label={rs.name}
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuickToggle(u.id, rs.id);
                                }}
                                sx={{
                                  fontSize: "0.65rem",
                                  height: 18,
                                  cursor: "pointer",
                                  bgcolor: selectedRS.includes(rs.id)
                                    ? "rgba(99,102,241,0.15)"
                                    : "rgba(99,102,241,0.07)",
                                  color: "#6366f1",
                                  border: selectedRS.includes(rs.id)
                                    ? "1px solid rgba(99,102,241,0.4)"
                                    : "1px solid transparent",
                                  "&:hover": {
                                    bgcolor: "rgba(239,68,68,0.1)",
                                    color: "#ef4444",
                                  },
                                }}
                              />
                            </Tooltip>
                          ))}
                        </Stack>
                      )}

                      {/* Rol del usuario */}
                      <Typography
                        fontSize="0.72rem"
                        color="text.disabled"
                        mt={0.25}
                      >
                        {u.role?.name ?? "—"}
                        {u.supervisor &&
                          ` · Supervisor: ${u.supervisor.name} ${u.supervisor.last_name}`}
                      </Typography>
                    </Box>
                  </Box>
                );
              })
            )}
          </Box>
        </Paper>
      </Stack>

      {/* Footer de ayuda */}
      <Paper sx={{ mt: 2.5, p: 2, borderRadius: 3, bgcolor: "#f8fafc" }}>
        <Stack direction="row" spacing={3} flexWrap="wrap">
          <Typography fontSize="0.78rem" color="text.secondary">
            💡 <strong>Selecciona</strong> RS a la izquierda y usuarios a la
            derecha, luego usa los botones de acción.
          </Typography>
          <Typography fontSize="0.78rem" color="text.secondary">
            🖱️ <strong>Click rápido</strong> en un chip de RS dentro de un
            usuario para asignar/quitar esa RS directamente.
          </Typography>
          {hasRole("superadmin") && (
            <Typography fontSize="0.78rem" color="text.secondary">
              👑 <strong>Superadmin:</strong> puedes asignar cualquier RS a
              cualquier usuario.
            </Typography>
          )}
          {hasRole("admin") && !hasRole("superadmin") && (
            <Typography fontSize="0.78rem" color="text.secondary">
              🔑 <strong>Admin:</strong> puedes asignar RS activas a
              supervisores y usuarios.
            </Typography>
          )}
          {hasRole("supervisor") && !hasRole("superadmin", "admin") && (
            <Typography fontSize="0.78rem" color="text.secondary">
              👥 <strong>Supervisor:</strong> puedes asignar tus RS a tus
              usuarios asignados.
            </Typography>
          )}
        </Stack>
      </Paper>
    </Box>
  );
}
