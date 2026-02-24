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

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtros
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

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

  // Carga roles para el filtro
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

  // Filtrado local
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

  const paginated = filtered.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );
  const totalPages = Math.ceil(filtered.length / rowsPerPage);

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
            Nuevo usuario
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 2.5, borderRadius: 3 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
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
          <TextField
            select
            size="small"
            label="Rol"
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(0);
            }}
            sx={{ minWidth: 150 }}
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
            label="Estado"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
            sx={{ minWidth: 140 }}
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
      </Paper>

      {/* Tabla */}
      <Paper sx={{ borderRadius: 3, overflow: "hidden" }}>
        <TableContainer>
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
                  "Estado",
                  "Acciones",
                ].map((h) => (
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
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 9 }).map((_, j) => (
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
                      <TableCell sx={{ fontSize: "0.85rem" }}>
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
                          <Typography fontSize="0.75rem" color="text.disabled">
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
                          <Typography fontSize="0.75rem" color="text.disabled">
                            —
                          </Typography>
                        )}
                      </TableCell>

                      {/* Supervisor */}
                      <TableCell sx={{ fontSize: "0.8rem" }}>
                        {u.supervisor ? (
                          <Typography fontSize="0.8rem">
                            {[u.supervisor.name, u.supervisor.last_name]
                              .filter(Boolean)
                              .join(" ")}
                          </Typography>
                        ) : (
                          <Typography fontSize="0.75rem" color="text.disabled">
                            Sin asignar
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

        {/* Paginación simple */}
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
        onSaved={fetchUsers}
      />

      {/* Confirm delete */}
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
