import {
  Add,
  Delete,
  Edit,
  PersonAdd,
  Refresh,
  Search,
} from "@mui/icons-material";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { getRoles } from "../../api/rolesApi";
import { deleteUser, getUsers } from "../../api/usersApi";
import ConfirmDialog from "../../components/shared/ConfirmDialog";
import { useAuth } from "../../context/AuthContext";
import AssignSupervisorModal from "./AssignSupervisorModal";
import UserFormModal from "./UserFormModal";

const roleColor = (roleName) => {
  const map = {
    superadmin: { bgcolor: "rgba(239,68,68,0.1)", color: "#ef4444" },
    admin: { bgcolor: "rgba(245,158,11,0.1)", color: "#f59e0b" },
    supervisor: { bgcolor: "rgba(99,102,241,0.1)", color: "#6366f1" },
    usuario: { bgcolor: "rgba(16,185,129,0.1)", color: "#10b981" },
  };
  return (
    map[roleName?.toLowerCase()] || {
      bgcolor: "rgba(156,163,175,0.15)",
      color: "#9ca3af",
    }
  );
};

const fullName = (u) =>
  [u.name, u.middle_name, u.last_name, u.second_last_name]
    .filter(Boolean)
    .join(" ");

export default function UsersPage() {
  const { hasRole } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtros
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");

  // Paginación local
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(20);

  // Modales
  const [formModal, setFormModal] = useState({ open: false, user: null });
  const [assignModal, setAssignModal] = useState({ open: false, user: null });
  const [confirmDelete, setConfirmDelete] = useState({
    open: false,
    user: null,
  });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    getRoles()
      .then(({ data }) => setRoles(data))
      .catch(() => {});
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await getUsers();
      setUsers(Array.isArray(data) ? data : (data.data ?? []));
    } catch {
      setError("No se pudieron cargar los usuarios");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filtered = users.filter((u) => {
    const nombre = fullName(u).toLowerCase();
    const matchSearch =
      !search ||
      nombre.includes(search.toLowerCase()) ||
      u.username?.toLowerCase().includes(search.toLowerCase()) ||
      u.emails?.some((e) =>
        (e.email ?? e).toLowerCase().includes(search.toLowerCase()),
      );
    const matchRole = !roleFilter || String(u.role_id) === String(roleFilter);
    const matchStatus =
      statusFilter === ""
        ? true
        : statusFilter === "activo"
          ? u.is_active
          : !u.is_active;
    return matchSearch && matchRole && matchStatus;
  });

  const sorted = [...filtered].sort((a, b) =>
    sortOrder === "asc"
      ? (a.name ?? "").toLowerCase().localeCompare((b.name ?? "").toLowerCase())
      : (b.name ?? "")
          .toLowerCase()
          .localeCompare((a.name ?? "").toLowerCase()),
  );
  const paginated = sorted.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );
  const totalPages = Math.ceil(sorted.length / rowsPerPage);

  const handleDelete = async () => {
    if (!confirmDelete.user) return;
    setDeleting(true);
    try {
      await deleteUser(confirmDelete.user.id);
      await fetchUsers();
      setConfirmDelete({ open: false, user: null });
    } catch {
      setError("No se pudo eliminar el usuario");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box>
      {/* Header */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start"
        mb={3}
        flexWrap="wrap"
        gap={1}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Usuarios
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.25}>
            {filtered.length} usuario(s) encontrado(s)
          </Typography>
        </Box>
        {hasRole("superadmin", "admin") && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setFormModal({ open: true, user: null })}
            sx={{
              borderRadius: 2,
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            }}
          >
            {isMobile ? "Nuevo" : "Nuevo usuario"}
          </Button>
        )}
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 2.5, borderRadius: 3 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          alignItems={{ sm: "center" }}
        >
          <TextField
            size="small"
            fullWidth
            placeholder="Buscar por nombre, username o email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ fontSize: 18, color: "text.secondary" }} />
                </InputAdornment>
              ),
            }}
          />
          <Stack direction="row" spacing={1.5}>
            <TextField
              select
              size="small"
              sx={{ minWidth: { xs: "100%", sm: 250 } }}
              label="Rol"
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(0);
              }}
            >
              <MenuItem value="">Todos</MenuItem>
              {roles.map((r) => (
                <MenuItem key={r.id} value={r.id}>
                  {r.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              sx={{ minWidth: { xs: "100%", sm: 240 } }}
              label="Estado"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="activo">Activo</MenuItem>
              <MenuItem value="inactivo">Inactivo</MenuItem>
            </TextField>
            <Tooltip title="Refrescar">
              <IconButton
                onClick={fetchUsers}
                sx={{ border: "1px solid #e2e8f0", borderRadius: 2 }}
              >
                <Refresh fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </Paper>

      {/* ── Vista MÓVIL: tarjetas ── */}
      {isMobile ? (
        <>
          <Stack spacing={1.5}>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Paper key={i} sx={{ p: 2, borderRadius: 3 }}>
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="text" width="40%" />
                </Paper>
              ))
            ) : paginated.length === 0 ? (
              <Paper sx={{ p: 4, borderRadius: 3, textAlign: "center" }}>
                <Typography color="text.secondary">
                  No se encontraron usuarios
                </Typography>
              </Paper>
            ) : (
              paginated.map((u) => {
                const colors = roleColor(u.role?.name);
                return (
                  <Paper
                    key={u.id}
                    sx={{
                      p: 2,
                      borderRadius: 3,
                      opacity: u.is_active ? 1 : 0.6,
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <Stack
                      direction="row"
                      alignItems="flex-start"
                      spacing={1.5}
                    >
                      <Avatar
                        sx={{
                          width: 40,
                          height: 40,
                          fontSize: "0.9rem",
                          bgcolor: u.is_active
                            ? "rgba(99,102,241,0.1)"
                            : "#f1f5f9",
                          color: u.is_active ? "#6366f1" : "#9ca3af",
                          flexShrink: 0,
                        }}
                      >
                        {u.name?.[0]?.toUpperCase()}
                      </Avatar>

                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={0.75}
                          flexWrap="wrap"
                          mb={0.25}
                        >
                          <Typography fontWeight={600} fontSize="0.9rem" noWrap>
                            {fullName(u)}
                          </Typography>
                        </Stack>
                        <Typography
                          fontSize="0.78rem"
                          color="text.secondary"
                          mb={0.5}
                        >
                          {u.username}
                        </Typography>
                        <Stack
                          direction="row"
                          spacing={0.5}
                          flexWrap="wrap"
                          gap={0.5}
                          mb={0.5}
                        >
                          <Chip
                            label={u.role?.name ?? "—"}
                            size="small"
                            sx={{
                              ...colors,
                              fontSize: "0.65rem",
                              fontWeight: 600,
                              textTransform: "capitalize",
                            }}
                          />
                          <Chip
                            label={u.is_active ? "Activo" : "Inactivo"}
                            size="small"
                            sx={{
                              fontSize: "0.65rem",
                              fontWeight: 600,
                              bgcolor: u.is_active
                                ? "rgba(16,185,129,0.1)"
                                : "rgba(156,163,175,0.15)",
                              color: u.is_active ? "#10b981" : "#9ca3af",
                            }}
                          />
                        </Stack>
                        {u.emails?.length > 0 && (
                          <Typography
                            fontSize="0.75rem"
                            color="text.secondary"
                            noWrap
                          >
                            {u.emails[0].email ?? u.emails[0]}
                          </Typography>
                        )}
                        {u.supervisores?.length > 0 && (
                          <Typography fontSize="0.72rem" color="text.disabled">
                            Supervisor: {u.supervisores[0].name}{" "}
                            {u.supervisores[0].last_name}
                          </Typography>
                        )}
                      </Box>

                      {hasRole("superadmin", "admin") && (
                        <Stack direction="column" spacing={0.25} flexShrink={0}>
                          <Tooltip title="Editar">
                            <IconButton
                              size="small"
                              onClick={() =>
                                setFormModal({ open: true, user: u })
                              }
                              sx={{
                                "&:hover": {
                                  color: "#6366f1",
                                  bgcolor: "rgba(99,102,241,0.06)",
                                },
                              }}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Asignar supervisor">
                            <IconButton
                              size="small"
                              onClick={() =>
                                setAssignModal({ open: true, user: u })
                              }
                              sx={{
                                "&:hover": {
                                  color: "#f59e0b",
                                  bgcolor: "rgba(245,158,11,0.06)",
                                },
                              }}
                            >
                              <PersonAdd fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar">
                            <IconButton
                              size="small"
                              onClick={() =>
                                setConfirmDelete({ open: true, user: u })
                              }
                              sx={{
                                "&:hover": {
                                  color: "error.main",
                                  bgcolor: "rgba(239,68,68,0.06)",
                                },
                              }}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      )}
                    </Stack>
                  </Paper>
                );
              })
            )}
          </Stack>

          {/* Paginación móvil */}
          {!loading && filtered.length > rowsPerPage && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mt: 2,
              }}
            >
              <Typography fontSize="0.8rem" color="text.secondary">
                {page * rowsPerPage + 1}–
                {Math.min((page + 1) * rowsPerPage, filtered.length)} de{" "}
                {filtered.length}
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  variant="outlined"
                  color="inherit"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                  sx={{ borderRadius: 2, borderColor: "#e2e8f0" }}
                >
                  Anterior
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="inherit"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                  sx={{ borderRadius: 2, borderColor: "#e2e8f0" }}
                >
                  Siguiente
                </Button>
              </Stack>
            </Box>
          )}
        </>
      ) : (
        /* ── Vista DESKTOP: tabla ── */
        <Paper sx={{ borderRadius: 3, overflow: "hidden" }}>
          <TableContainer sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "#f8fafc" }}>
                  {[
                    "#",
                    "Usuario",
                    "Nombre completo",
                    "Rol",
                    "Emails",
                    "Teléfonos",
                    "Supervisor",
                    "F. Creación",
                    "F. Bloqueo",
                    "Estado",
                    "Acciones",
                  ].map((h) =>
                    h === "Nombre completo" ? (
                      <TableCell
                        key={h}
                        onClick={() =>
                          setSortOrder((o) => (o === "asc" ? "desc" : "asc"))
                        }
                        sx={{
                          fontWeight: 600,
                          fontSize: "0.8rem",
                          whiteSpace: "nowrap",
                          cursor: "pointer",
                          userSelect: "none",
                          color: "#6366f1",
                          "&:hover": { bgcolor: "rgba(99,102,241,0.04)" },
                        }}
                      >
                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={0.5}
                        >
                          <span>Nombre completo</span>
                          <span style={{ fontSize: "0.75rem" }}>
                            {sortOrder === "asc" ? "↑" : "↓"}
                          </span>
                        </Stack>
                      </TableCell>
                    ) : (
                      <TableCell
                        key={h}
                        sx={{
                          fontWeight: 600,
                          fontSize: "0.8rem",
                          color: "text.secondary",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {h}
                      </TableCell>
                    ),
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 11 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton variant="text" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : paginated.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      align="center"
                      sx={{ py: 5, color: "text.secondary" }}
                    >
                      No se encontraron usuarios
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((u, index) => {
                    const colors = roleColor(u.role?.name);
                    return (
                      <TableRow
                        key={u.id}
                        sx={{
                          "&:hover": { bgcolor: "#f8f9ff" },
                          "&:last-child td": { border: 0 },
                          opacity: u.is_active ? 1 : 0.6,
                        }}
                      >
                        {/* # */}
                        <TableCell
                          sx={{ color: "text.secondary", fontSize: "0.8rem" }}
                        >
                          {page * rowsPerPage + index + 1}
                        </TableCell>

                        {/* Usuario */}
                        <TableCell>
                          <Stack
                            direction="row"
                            alignItems="center"
                            spacing={1.25}
                          >
                            <Avatar
                              sx={{
                                width: 30,
                                height: 30,
                                fontSize: "0.75rem",
                                bgcolor: u.is_active
                                  ? "rgba(99,102,241,0.1)"
                                  : "#f1f5f9",
                                color: u.is_active ? "#6366f1" : "#9ca3af",
                              }}
                            >
                              {u.name?.[0]?.toUpperCase()}
                            </Avatar>
                            <Typography fontSize="0.85rem" fontWeight={500}>
                              {u.username}
                            </Typography>
                          </Stack>
                        </TableCell>

                        {/* Nombre completo */}
                        <TableCell>
                          <Typography fontSize="0.85rem" fontWeight={500}>
                            {fullName(u)}
                          </Typography>
                        </TableCell>

                        {/* Rol */}
                        <TableCell>
                          <Chip
                            label={u.role?.name ?? "—"}
                            size="small"
                            sx={{
                              ...colors,
                              fontSize: "0.7rem",
                              fontWeight: 600,
                              textTransform: "capitalize",
                            }}
                          />
                        </TableCell>

                        {/* Emails */}
                        <TableCell sx={{ maxWidth: 180 }}>
                          {u.emails?.length > 0 ? (
                            <Stack spacing={0.25}>
                              {u.emails.slice(0, 2).map((e, i) => (
                                <Typography
                                  key={i}
                                  fontSize="0.75rem"
                                  color="text.secondary"
                                  noWrap
                                >
                                  {e.email ?? e}
                                </Typography>
                              ))}
                              {u.emails.length > 2 && (
                                <Typography
                                  fontSize="0.7rem"
                                  color="text.disabled"
                                >
                                  +{u.emails.length - 2} más
                                </Typography>
                              )}
                            </Stack>
                          ) : (
                            <Typography
                              fontSize="0.75rem"
                              color="text.disabled"
                            >
                              —
                            </Typography>
                          )}
                        </TableCell>

                        {/* Teléfonos */}
                        <TableCell sx={{ maxWidth: 140 }}>
                          {u.phones?.length > 0 ? (
                            <Stack spacing={0.25}>
                              {u.phones.slice(0, 2).map((p, i) => (
                                <Typography
                                  key={i}
                                  fontSize="0.75rem"
                                  color="text.secondary"
                                  noWrap
                                >
                                  {p.phone_number ?? p}
                                </Typography>
                              ))}
                              {u.phones.length > 2 && (
                                <Typography
                                  fontSize="0.7rem"
                                  color="text.disabled"
                                >
                                  +{u.phones.length - 2} más
                                </Typography>
                              )}
                            </Stack>
                          ) : (
                            <Typography
                              fontSize="0.75rem"
                              color="text.disabled"
                            >
                              —
                            </Typography>
                          )}
                        </TableCell>

                        {/* Supervisor */}
                        <TableCell>
                          {u.supervisores?.length > 0 ? (
                            <Typography fontSize="0.8rem">
                              {u.supervisores[0].name}{" "}
                              {u.supervisores[0].last_name}
                            </Typography>
                          ) : (
                            <Typography
                              fontSize="0.75rem"
                              color="text.disabled"
                            >
                              Sin asignar
                            </Typography>
                          )}
                        </TableCell>

                        {/* Fecha creación */}
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          {u.created_at ? (
                            new Date(u.created_at).toLocaleDateString("es-PE", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })
                          ) : (
                            <Typography
                              fontSize="0.75rem"
                              color="text.disabled"
                            >
                              —
                            </Typography>
                          )}
                        </TableCell>

                        {/* Fecha baja */}
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          {!u.is_active && u.updated_at ? (
                            new Date(u.updated_at).toLocaleDateString("es-PE", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })
                          ) : (
                            <Typography
                              fontSize="0.75rem"
                              color="text.disabled"
                            >
                              —
                            </Typography>
                          )}
                        </TableCell>

                        {/* Estado */}
                        <TableCell>
                          <Chip
                            label={u.is_active ? "Activo" : "Inactivo"}
                            size="small"
                            sx={{
                              fontSize: "0.7rem",
                              fontWeight: 600,
                              bgcolor: u.is_active
                                ? "rgba(16,185,129,0.1)"
                                : "rgba(156,163,175,0.15)",
                              color: u.is_active ? "#10b981" : "#9ca3af",
                            }}
                          />
                        </TableCell>

                        {/* Acciones */}
                        <TableCell>
                          {hasRole("superadmin", "admin") && (
                            <Stack direction="row" spacing={0.5}>
                              <Tooltip title="Editar">
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    setFormModal({ open: true, user: u })
                                  }
                                  sx={{
                                    "&:hover": {
                                      color: "#6366f1",
                                      bgcolor: "rgba(99,102,241,0.06)",
                                    },
                                  }}
                                >
                                  <Edit fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Asignar supervisor">
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    setAssignModal({ open: true, user: u })
                                  }
                                  sx={{
                                    "&:hover": {
                                      color: "#f59e0b",
                                      bgcolor: "rgba(245,158,11,0.06)",
                                    },
                                  }}
                                >
                                  <PersonAdd fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Eliminar">
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    setConfirmDelete({ open: true, user: u })
                                  }
                                  sx={{
                                    "&:hover": {
                                      color: "error.main",
                                      bgcolor: "rgba(239,68,68,0.06)",
                                    },
                                  }}
                                >
                                  <Delete fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Paginación desktop */}
          {!loading && filtered.length > rowsPerPage && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                px: 2.5,
                py: 1.5,
                borderTop: "1px solid #e2e8f0",
              }}
            >
              <Typography fontSize="0.8rem" color="text.secondary">
                Mostrando {page * rowsPerPage + 1}–
                {Math.min((page + 1) * rowsPerPage, filtered.length)} de{" "}
                {filtered.length}
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  variant="outlined"
                  color="inherit"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                  sx={{
                    borderRadius: 2,
                    borderColor: "#e2e8f0",
                    fontSize: "0.75rem",
                  }}
                >
                  Anterior
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="inherit"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                  sx={{
                    borderRadius: 2,
                    borderColor: "#e2e8f0",
                    fontSize: "0.75rem",
                  }}
                >
                  Siguiente
                </Button>
              </Stack>
            </Box>
          )}
        </Paper>
      )}

      {/* Modales */}
      <UserFormModal
        open={formModal.open}
        user={formModal.user}
        onClose={() => setFormModal({ open: false, user: null })}
        onSaved={fetchUsers}
      />
      <AssignSupervisorModal
        open={assignModal.open}
        user={assignModal.user}
        onClose={() => setAssignModal({ open: false, user: null })}
        onSuccess={fetchUsers}
      />
      <ConfirmDialog
        open={confirmDelete.open}
        title="Eliminar usuario"
        description={
          confirmDelete.user
            ? `¿Estás seguro de eliminar a ${fullName(confirmDelete.user)}? Esta acción no se puede deshacer.`
            : ""
        }
        confirmLabel="Sí, eliminar"
        confirmColor="error"
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() =>
          !deleting && setConfirmDelete({ open: false, user: null })
        }
      />
    </Box>
  );
}
