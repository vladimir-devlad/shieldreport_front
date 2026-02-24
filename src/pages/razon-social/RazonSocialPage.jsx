import {
  PeopleAlt,
  Refresh,
  Search,
  ToggleOff,
  ToggleOn,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Skeleton,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getRazonesSociales,
  toggleRazonSocial,
} from "../../api/razonSocialApi";

const ESTADO_FILTER = ["todas", "activas", "inactivas"];

export default function RazonSocialPage() {
  const navigate = useNavigate();

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("todas");
  const [toggling, setToggling] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    action: null,
  });
  const [bulkLoading, setBulkLoading] = useState(false);

  const fetchRS = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await getRazonesSociales();
      setList(data);
    } catch {
      setError("No se pudieron cargar las razones sociales");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRS();
  }, [fetchRS]);

  const handleToggle = async (rs) => {
    setToggling(rs.id);
    try {
      await toggleRazonSocial(rs.id);
      setList((prev) =>
        prev.map((item) =>
          item.id === rs.id ? { ...item, is_active: !item.is_active } : item,
        ),
      );
    } catch {
      setError("No se pudo cambiar el estado de la razón social");
    } finally {
      setToggling(null);
    }
  };

  const handleBulkToggle = async (activar) => {
    setBulkLoading(true);
    setError(null);
    try {
      const targets = list.filter((rs) => rs.is_active !== activar);
      await Promise.all(targets.map((rs) => toggleRazonSocial(rs.id)));
      setList((prev) => prev.map((rs) => ({ ...rs, is_active: activar })));
    } catch {
      setError("Ocurrió un error al actualizar las razones sociales");
    } finally {
      setBulkLoading(false);
      setConfirmDialog({ open: false, action: null });
    }
  };

  const filtered = list.filter((rs) => {
    const matchSearch =
      !search || rs.name.toLowerCase().includes(search.toLowerCase());
    const matchEstado =
      estadoFilter === "todas"
        ? true
        : estadoFilter === "activas"
          ? rs.is_active
          : !rs.is_active;
    return matchSearch && matchEstado;
  });

  const activeCount = list.filter((rs) => rs.is_active).length;
  const inactiveCount = list.filter((rs) => !rs.is_active).length;

  // ── Todo dentro del return ──────────────────────
  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          Razón Social
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={0.25}>
          Selecciona las razones sociales con las que se trabajará
        </Typography>
      </Box>

      {/* KPIs */}
      <Stack direction="row" spacing={2} mb={3}>
        <Paper
          sx={{
            px: 2.5,
            py: 1.75,
            borderRadius: 3,
            flex: 1,
            textAlign: "center",
          }}
        >
          <Typography fontSize="0.75rem" color="text.secondary" mb={0.25}>
            Total
          </Typography>
          <Typography fontWeight={700} fontSize="1.8rem">
            {list.length}
          </Typography>
        </Paper>
        <Paper
          sx={{
            px: 2.5,
            py: 1.75,
            borderRadius: 3,
            flex: 1,
            textAlign: "center",
          }}
        >
          <Typography fontSize="0.75rem" color="text.secondary" mb={0.25}>
            Activas
          </Typography>
          <Typography fontWeight={700} fontSize="1.8rem" color="#10b981">
            {activeCount}
          </Typography>
        </Paper>
        <Paper
          sx={{
            px: 2.5,
            py: 1.75,
            borderRadius: 3,
            flex: 1,
            textAlign: "center",
          }}
        >
          <Typography fontSize="0.75rem" color="text.secondary" mb={0.25}>
            Inactivas
          </Typography>
          <Typography fontWeight={700} fontSize="1.8rem" color="#9ca3af">
            {inactiveCount}
          </Typography>
        </Paper>
      </Stack>

      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 2.5, borderRadius: 3 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems="center"
        >
          <TextField
            size="small"
            placeholder="Buscar razón social..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ flex: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ fontSize: 18, color: "text.secondary" }} />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            select
            size="small"
            label="Estado"
            value={estadoFilter}
            onChange={(e) => setEstadoFilter(e.target.value)}
            sx={{ minWidth: 160 }}
          >
            {ESTADO_FILTER.map((e) => (
              <MenuItem key={e} value={e}>
                {e === "todas"
                  ? "Todas"
                  : e === "activas"
                    ? "Solo activas"
                    : "Solo inactivas"}
              </MenuItem>
            ))}
          </TextField>

          <Tooltip title="Activar todas las RS">
            <span>
              <Button
                size="small"
                variant="outlined"
                startIcon={<ToggleOn />}
                disabled={bulkLoading || activeCount === list.length}
                onClick={() => setConfirmDialog({ open: true, action: true })}
                sx={{
                  borderRadius: 2,
                  borderColor: "#e2e8f0",
                  color: "#10b981",
                  whiteSpace: "nowrap",
                  "&:hover": {
                    borderColor: "#10b981",
                    bgcolor: "rgba(16,185,129,0.06)",
                  },
                }}
              >
                Activar todas
              </Button>
            </span>
          </Tooltip>

          <Tooltip title="Desactivar todas las RS">
            <span>
              <Button
                size="small"
                variant="outlined"
                startIcon={<ToggleOff />}
                disabled={bulkLoading || inactiveCount === list.length}
                onClick={() => setConfirmDialog({ open: true, action: false })}
                sx={{
                  borderRadius: 2,
                  borderColor: "#e2e8f0",
                  color: "#9ca3af",
                  whiteSpace: "nowrap",
                  "&:hover": {
                    borderColor: "#ef4444",
                    color: "#ef4444",
                    bgcolor: "rgba(239,68,68,0.06)",
                  },
                }}
              >
                Desactivar todas
              </Button>
            </span>
          </Tooltip>

          <Tooltip title="Refrescar">
            <IconButton
              onClick={fetchRS}
              sx={{ border: "1px solid #e2e8f0", borderRadius: 2 }}
            >
              <Refresh fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* Tabla */}
      <Paper sx={{ borderRadius: 3, overflow: "hidden" }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: "#f8fafc" }}>
                {[
                  "#",
                  "Razón Social",
                  "Estado",
                  "Trabajar con esta RS",
                  "Asignar usuarios",
                ].map((h) => (
                  <TableCell
                    key={h}
                    sx={{
                      fontWeight: 600,
                      fontSize: "0.8rem",
                      color: "text.secondary",
                    }}
                  >
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton variant="text" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    align="center"
                    sx={{ py: 5, color: "text.secondary" }}
                  >
                    No se encontraron razones sociales
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((rs, index) => (
                  <TableRow
                    key={rs.id}
                    sx={{
                      "&:hover": { bgcolor: "#f8f9ff" },
                      "&:last-child td": { border: 0 },
                      opacity: rs.is_active ? 1 : 0.55,
                      transition: "opacity 0.2s",
                    }}
                  >
                    <TableCell
                      sx={{ color: "text.secondary", fontSize: "0.8rem" }}
                    >
                      {index + 1}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{rs.name}</TableCell>
                    <TableCell>
                      <Chip
                        label={rs.is_active ? "Activa" : "Inactiva"}
                        size="small"
                        sx={{
                          fontSize: "0.7rem",
                          fontWeight: 600,
                          bgcolor: rs.is_active
                            ? "rgba(16,185,129,0.1)"
                            : "rgba(156,163,175,0.15)",
                          color: rs.is_active ? "#10b981" : "#9ca3af",
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Switch
                          checked={rs.is_active}
                          onChange={() => handleToggle(rs)}
                          disabled={toggling === rs.id}
                          size="small"
                          sx={{
                            "& .MuiSwitch-switchBase.Mui-checked": {
                              color: "#6366f1",
                            },
                            "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track":
                              { bgcolor: "#6366f1" },
                          }}
                        />
                        <Typography fontSize="0.75rem" color="text.secondary">
                          {toggling === rs.id
                            ? "Actualizando..."
                            : rs.is_active
                              ? "Se trabajará"
                              : "No se trabajará"}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Tooltip
                        title={
                          !rs.is_active
                            ? "Activa la RS para poder asignarla"
                            : "Asignar a usuarios"
                        }
                      >
                        <span>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={
                              <PeopleAlt sx={{ fontSize: "14px !important" }} />
                            }
                            disabled={!rs.is_active}
                            onClick={() =>
                              navigate(`/razon-social/${rs.id}/asignar`, {
                                state: { rs },
                              })
                            }
                            sx={{
                              borderRadius: 2,
                              borderColor: "#e2e8f0",
                              color: "text.secondary",
                              fontSize: "0.75rem",
                              "&:hover": {
                                borderColor: "#6366f1",
                                color: "#6366f1",
                                bgcolor: "rgba(99,102,241,0.06)",
                              },
                            }}
                          >
                            Asignar
                          </Button>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* ── Diálogo de confirmación bulk — DENTRO del return ── */}
      <Dialog
        open={confirmDialog.open}
        onClose={() =>
          !bulkLoading && setConfirmDialog({ open: false, action: null })
        }
        PaperProps={{ sx: { borderRadius: 3, maxWidth: 400 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          {confirmDialog.action ? "Activar todas" : "Desactivar todas"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText fontSize="0.9rem">
            {confirmDialog.action
              ? `Se activarán ${inactiveCount} razón(es) social(es) inactivas. Estarán disponibles para asignarse a usuarios.`
              : `Se desactivarán ${activeCount} razón(es) social(es) activas. Dejarán de estar disponibles.`}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button
            onClick={() => setConfirmDialog({ open: false, action: null })}
            variant="outlined"
            color="inherit"
            disabled={bulkLoading}
            sx={{ borderRadius: 2, borderColor: "#e2e8f0" }}
          >
            Cancelar
          </Button>
          <Button
            onClick={() => handleBulkToggle(confirmDialog.action)}
            variant="contained"
            disabled={bulkLoading}
            sx={{
              borderRadius: 2,
              bgcolor: confirmDialog.action ? "#10b981" : "#ef4444",
              "&:hover": {
                bgcolor: confirmDialog.action ? "#059669" : "#dc2626",
              },
              px: 3,
            }}
          >
            {bulkLoading ? (
              <CircularProgress size={20} sx={{ color: "#fff" }} />
            ) : confirmDialog.action ? (
              "Sí, activar todas"
            ) : (
              "Sí, desactivar todas"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
