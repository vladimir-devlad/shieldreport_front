import {
  Close,
  ExpandMore,
  Group,
  PersonAdd,
  PersonRemove,
  Refresh,
  Search,
} from "@mui/icons-material";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
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
  DialogContentText,
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
  Tooltip,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { agregarUsuario, removerUsuario } from "../../api/supervisorApi";
import { getUsers, getUsersSinSuper } from "../../api/usersApi";

export default function AdminSupervisorView() {
  const [supervisores, setSupervisores] = useState([]);
  const [sinSupervisor, setSinSupervisor] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  // Dialog asignar
  const [assignDialog, setAssignDialog] = useState({
    open: false,
    supervisor: null,
  });
  const [searchAssign, setSearchAssign] = useState("");
  const [selected, setSelected] = useState([]);
  const [assigning, setAssigning] = useState(false);

  // Dialog remover
  const [removeDialog, setRemoveDialog] = useState({
    open: false,
    supervisor: null,
    user: null,
  });
  const [removing, setRemoving] = useState(false);

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

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [{ data: allUsers }, sinSup] = await Promise.all([
        getUsers(),
        fetchAllSinSupervisor(),
      ]);
      setSupervisores(allUsers.filter((u) => u.role_id === 3));
      setSinSupervisor(sinSup);
    } catch {
      setError("No se pudieron cargar los datos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Abre el dialog y resetea selección
  const handleOpenAssign = (e, sup) => {
    e.stopPropagation();
    setSelected([]);
    setSearchAssign("");
    setAssignDialog({ open: true, supervisor: sup });
  };

  const handleCloseAssign = () => {
    if (assigning) return;
    setAssignDialog({ open: false, supervisor: null });
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

  const handleAsignar = async () => {
    if (!selected.length || !assignDialog.supervisor) return;
    setAssigning(true);
    try {
      await Promise.all(
        selected.map((userId) =>
          agregarUsuario(assignDialog.supervisor.id, userId),
        ),
      );
      await fetchData();
      handleCloseAssign();
    } catch {
      setError("No se pudieron asignar algunos usuarios");
    } finally {
      setAssigning(false);
    }
  };

  const handleRemover = async () => {
    if (!removeDialog.supervisor || !removeDialog.user) return;
    setRemoving(true);
    try {
      await removerUsuario(removeDialog.supervisor.id, removeDialog.user.id);
      await fetchData();
      setRemoveDialog({ open: false, supervisor: null, user: null });
    } catch {
      setError("No se pudo remover el usuario");
    } finally {
      setRemoving(false);
    }
  };

  const filteredSups = supervisores.filter(
    (s) =>
      !search ||
      `${s.name} ${s.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
      s.username.toLowerCase().includes(search.toLowerCase()),
  );

  // Usuarios libres filtrados por el search del dialog
  const filteredSinSup = sinSupervisor.filter(
    (u) =>
      !searchAssign ||
      `${u.name} ${u.last_name}`
        .toLowerCase()
        .includes(searchAssign.toLowerCase()) ||
      u.username.toLowerCase().includes(searchAssign.toLowerCase()),
  );

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Supervisores
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.25}>
            Gestión de grupos y asignación de usuarios
          </Typography>
        </Box>
        {sinSupervisor.length > 0 && (
          <Chip
            label={`${sinSupervisor.length} usuario(s) sin supervisor`}
            color="warning"
            size="small"
            sx={{ fontWeight: 600 }}
          />
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* Buscador supervisores */}
      <Paper sx={{ p: 2, mb: 2.5, borderRadius: 3 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={{ xs: 1, sm: 2 }}
          sx={{ flex: 1, mr: 2 }}
        >
          <TextField
            size="small"
            fullWidth
            placeholder="Buscar supervisor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ fontSize: 18, color: "text.secondary" }} />
                </InputAdornment>
              ),
            }}
          />
          <Tooltip title="Refrescar">
            <IconButton
              onClick={fetchData}
              sx={{ border: "1px solid #e2e8f0", borderRadius: 2 }}
            >
              <Refresh fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Paper>

      {/* Lista de supervisores */}
      {loading ? (
        Array.from({ length: 3 }).map((_, i) => (
          <Paper key={i} sx={{ mb: 1.5, borderRadius: 3, p: 2 }}>
            <Skeleton variant="text" width="40%" height={30} />
            <Skeleton variant="text" width="20%" />
          </Paper>
        ))
      ) : filteredSups.length === 0 ? (
        <Paper sx={{ p: 4, borderRadius: 3, textAlign: "center" }}>
          <Typography color="text.secondary">
            No se encontraron supervisores
          </Typography>
        </Paper>
      ) : (
        filteredSups.map((sup) => (
          <Accordion
            key={sup.id}
            sx={{
              mb: 1.5,
              borderRadius: "12px !important",
              border: "1px solid #e2e8f0",
              boxShadow: "0 1px 8px rgba(0,0,0,0.05)",
              "&:before": { display: "none" },
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMore />}
              sx={{ px: 2.5, py: 1 }}
            >
              <Stack
                direction="row"
                alignItems="center"
                spacing={2}
                sx={{ flex: 1, mr: 2 }}
              >
                <Avatar
                  sx={{
                    width: 40,
                    height: 40,
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  }}
                >
                  {sup.name?.[0]?.toUpperCase()}
                </Avatar>
                <Box>
                  <Typography fontWeight={600} fontSize="0.95rem">
                    {sup.name} {sup.last_name}
                  </Typography>
                  <Typography fontSize="0.75rem" color="text.secondary">
                    @{sup.username}
                  </Typography>
                </Box>
                <Chip
                  icon={<Group sx={{ fontSize: "14px !important" }} />}
                  label={`${sup.supervised_users?.length ?? 0} usuarios`}
                  size="small"
                  sx={{
                    ml: "auto",
                    mr: 1,
                    bgcolor: "rgba(99,102,241,0.08)",
                    color: "#6366f1",
                    fontWeight: 600,
                  }}
                />
                <Tooltip
                  title={
                    sinSupervisor.length === 0
                      ? "No hay usuarios libres"
                      : "Asignar usuarios"
                  }
                >
                  <span>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<PersonAdd fontSize="small" />}
                      disabled={sinSupervisor.length === 0}
                      onClick={(e) => handleOpenAssign(e, sup)}
                      sx={{
                        borderRadius: 2,
                        fontSize: "0.75px",
                        borderColor: "#e2e8f0",
                        color: "text.secondary",
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
              </Stack>
            </AccordionSummary>

            <AccordionDetails sx={{ px: 2.5, pt: 0, pb: 2 }}>
              {!sup.supervised_users?.length ? (
                <Typography
                  fontSize="0.85rem"
                  color="text.secondary"
                  sx={{ py: 1 }}
                >
                  Este supervisor no tiene usuarios asignados aún.
                </Typography>
              ) : (
                <List disablePadding>
                  {sup.supervised_users.map((u, idx) => (
                    <Box key={u.id}>
                      <ListItem
                        sx={{ px: 0, py: 1 }}
                        secondaryAction={
                          <Tooltip title="Remover del grupo">
                            <IconButton
                              size="small"
                              onClick={() =>
                                setRemoveDialog({
                                  open: true,
                                  supervisor: sup,
                                  user: u,
                                })
                              }
                              sx={{
                                "&:hover": {
                                  color: "error.main",
                                  bgcolor: "rgba(239,68,68,0.06)",
                                },
                              }}
                            >
                              <PersonRemove fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        }
                      >
                        <ListItemAvatar>
                          <Avatar
                            sx={{
                              width: 32,
                              height: 32,
                              fontSize: "0.75rem",
                              bgcolor: "#e2e8f0",
                              color: "#6b7280",
                            }}
                          >
                            {u.name?.[0]?.toUpperCase()}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography fontSize="0.875rem" fontWeight={500}>
                              {u.name} {u.last_name}
                              <Typography
                                component="span"
                                fontSize="0.75rem"
                                color="text.secondary"
                                ml={1}
                              >
                                @{u.username}
                              </Typography>
                            </Typography>
                          }
                          secondary={
                            u.razon_sociales?.length > 0 && (
                              <Stack
                                direction="row"
                                spacing={0.5}
                                mt={0.5}
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
                            )
                          }
                        />
                      </ListItem>
                      {idx < sup.supervised_users.length - 1 && <Divider />}
                    </Box>
                  ))}
                </List>
              )}
            </AccordionDetails>
          </Accordion>
        ))
      )}

      {/* ── Dialog asignar con checkbox ── */}
      <Dialog
        open={assignDialog.open}
        onClose={handleCloseAssign}
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
            <Typography fontWeight={700}>Asignar usuarios</Typography>
            <Typography fontSize="0.78rem" color="text.secondary">
              A:{" "}
              <strong>
                {assignDialog.supervisor?.name}{" "}
                {assignDialog.supervisor?.last_name}
              </strong>
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={handleCloseAssign}
            disabled={assigning}
          >
            <Close fontSize="small" />
          </IconButton>
        </DialogTitle>

        <Divider />

        {/* Search dentro del dialog */}
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
            {sinSupervisor.length} usuario(s) sin supervisor
          </Typography>
          <Button
            onClick={handleCloseAssign}
            variant="outlined"
            color="inherit"
            disabled={assigning}
            sx={{ borderRadius: 2, borderColor: "#e2e8f0" }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleAsignar}
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
              `Asignar ${selected.length > 0 ? `(${selected.length})` : ""}`
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Dialog confirmar remover ── */}
      <Dialog
        open={removeDialog.open}
        onClose={() =>
          !removing &&
          setRemoveDialog({ open: false, supervisor: null, user: null })
        }
        PaperProps={{ sx: { borderRadius: 3, maxWidth: 380 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          Remover usuario
        </DialogTitle>
        <DialogContent>
          <DialogContentText fontSize="0.9rem">
            ¿Estás seguro de remover a{" "}
            <strong>
              {removeDialog.user?.name} {removeDialog.user?.last_name}
            </strong>{" "}
            del grupo de <strong>{removeDialog.supervisor?.name}</strong>? El
            usuario quedará sin supervisor asignado.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button
            onClick={() =>
              setRemoveDialog({ open: false, supervisor: null, user: null })
            }
            variant="outlined"
            color="inherit"
            disabled={removing}
            sx={{ borderRadius: 2, borderColor: "#e2e8f0" }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleRemover}
            variant="contained"
            color="error"
            disabled={removing}
            sx={{ borderRadius: 2, px: 3 }}
          >
            {removing ? (
              <CircularProgress size={20} sx={{ color: "#fff" }} />
            ) : (
              "Sí, remover"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
