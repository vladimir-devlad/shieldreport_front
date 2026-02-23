import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  MenuItem,
  InputAdornment,
  TablePagination,
  Skeleton,
  Alert,
  Stack,
} from "@mui/material";
import {
  Add,
  Edit,
  Delete,
  Search,
  Refresh,
  ManageAccounts,
} from "@mui/icons-material";
import TableSortLabel from "@mui/material/TableSortLabel";
import { getUsers, deleteUser } from "../../api/usersApi";
import { useAuth } from "../../context/AuthContext";
import UserFormModal from "./UserFormModal";
import AssignSupervisorModal from "./AssignSupervisorModal";

const ROLE_LABELS = {
  1: { label: "Superadmin", color: "error" },
  2: { label: "Admin", color: "warning" },
  3: { label: "Supervisor", color: "info" },
  4: { label: "Usuario", color: "default" },
};

const ROLE_FILTER_BY_ROLE = {
  superadmin: [
    { id: "1", label: "Superadmin" },
    { id: "2", label: "Admin" },
    { id: "3", label: "Supervisor" },
    { id: "4", label: "Usuario" },
  ],
  admin: [
    { id: "2", label: "Admin" },
    { id: "3", label: "Supervisor" },
    { id: "4", label: "Usuario" },
  ],
  supervisor: [], // supervisor no ve filtro de rol
};

const ESTADOS_FILTER = ["todos", "activo", "inactivo"];

export default function UsersPage() {
  const { hasRole, user: me } = useAuth();
  const canEdit = hasRole("superadmin", "admin");
  const canAssign = hasRole("superadmin", "admin", "supervisor");

  // ── Estado ────────────────────────────────────
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [rolFilter, setRolFilter] = useState("todos");
  const [estadoFilter, setEstadoFilter] = useState("todos");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Modal crear/editar
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Modal asignar supervisor
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignUser, setAssignUser] = useState(null);

  // ── Fetch ─────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await getUsers();
      setUsers(data);
    } catch (err) {
      console.error("Error al cargar usuarios:", err);
      setError("No se pudieron cargar los usuarios");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ── Filtrado local ────────────────────────────
  const filtered = users.filter((u) => {
    const fullName = `${u.name} ${u.last_name}`.toLowerCase();
    const matchSearch =
      !search ||
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      fullName.includes(search.toLowerCase());
    const matchRol = rolFilter === "todos" || String(u.role_id) === rolFilter;
    const matchEstado =
      estadoFilter === "todos" ||
      (estadoFilter === "activo" ? u.is_active : !u.is_active);
    return matchSearch && matchRol && matchEstado;
  });

  const paginated = filtered.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  // ── Acciones ──────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar este usuario?")) return;
    try {
      await deleteUser(id);
      fetchUsers();
    } catch (err) {
      console.error("Error al eliminar:", err);
      setError("No se pudo eliminar el usuario");
    }
  };

  const handleOpenCreate = () => {
    setSelectedUser(null);
    setModalOpen(true);
  };
  const handleOpenEdit = (u) => {
    setSelectedUser(u);
    setModalOpen(true);
  };
  const handleOpenAssign = (u) => {
    setAssignUser(u);
    setAssignOpen(true);
  };

  // Columnas de la tabla
  const columns = [
    "#",
    "Username",
    "Nombre",
    "Apellido",
    "Rol",
    "Estado",
    "Supervisor",
    ...(canEdit || canAssign ? ["Acciones"] : []),
  ];

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
            Gestión de usuarios del sistema
          </Typography>
        </Box>
        {canEdit && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleOpenCreate}
            sx={{
              borderRadius: 2,
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              px: 2.5,
            }}
          >
            Nuevo usuario
          </Button>
        )}
      </Box>

      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 2.5, borderRadius: 3 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField
            size="small"
            placeholder="Buscar por username o nombre..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            sx={{ flex: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ fontSize: 18, color: "text.secondary" }} />
                </InputAdornment>
              ),
            }}
          />
          {me?.role !== "supervisor" && (
            <TextField
              select
              size="small"
              label="Rol"
              value={rolFilter}
              onChange={(e) => {
                setRolFilter(e.target.value);
                setPage(0);
              }}
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="todos">Todos los roles</MenuItem>
              {(ROLE_FILTER_BY_ROLE[me?.role] || []).map(({ id, label }) => (
                <MenuItem key={id} value={id}>
                  {label}
                </MenuItem>
              ))}
            </TextField>
          )}
          <TextField
            select
            size="small"
            label="Estado"
            value={estadoFilter}
            onChange={(e) => {
              setEstadoFilter(e.target.value);
              setPage(0);
            }}
            sx={{ minWidth: 150 }}
          >
            {ESTADOS_FILTER.map((e) => (
              <MenuItem key={e} value={e} sx={{ textTransform: "capitalize" }}>
                {e === "todos" ? "Todos los estados" : e}
              </MenuItem>
            ))}
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

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* Tabla */}
      {/* <Paper sx={{ borderRadius: 3, overflow: "hidden" }}>
        <TableContainer> */}
      <Paper
        sx={{
          borderRadius: 3,
          display: "flex",
          flexDirection: "column",
          // height: "60vh", // 👈 controla aquí la altura
          height: "calc(100vh - 300px)",
        }}
      >
        <TableContainer
          sx={{
            flex: 1,
            maxHeight: "100%",
            overflow: "auto",
          }}
        >
          <Table stickyHeader>
            <TableHead>
              <TableRow
                sx={{
                  bgcolor: "#f8fafc",
                  "& th": {
                    backgroundColor: "#f8fafc",
                  },
                }}
              >
                {columns.map((h) => (
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
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: columns.length }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton variant="text" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : paginated.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    align="center"
                    sx={{ py: 4, color: "text.secondary" }}
                  >
                    No se encontraron usuarios
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((u, index) => {
                  const roleInfo = ROLE_LABELS[u.role_id] || {
                    label: "—",
                    color: "default",
                  };
                  return (
                    <TableRow
                      key={u.id}
                      sx={{
                        "&:hover": { bgcolor: "#f8f9ff" },
                        "&:last-child td": { border: 0 },
                      }}
                    >
                      {/* # */}
                      <TableCell
                        sx={{ color: "text.secondary", fontSize: "0.8rem" }}
                      >
                        {page * rowsPerPage + index + 1}
                      </TableCell>

                      {/* Username */}
                      <TableCell sx={{ fontWeight: 500 }}>
                        {u.username}
                      </TableCell>

                      {/* Nombre */}
                      <TableCell>{u.name || "—"}</TableCell>

                      {/* Apellido */}
                      <TableCell>{u.last_name || "—"}</TableCell>

                      {/* Rol */}
                      <TableCell>
                        <Chip
                          label={roleInfo.label}
                          color={roleInfo.color}
                          size="small"
                          sx={{ fontSize: "0.7rem", fontWeight: 600 }}
                        />
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

                      {/* Supervisor */}
                      <TableCell>
                        {u.supervisor ? (
                          <Chip
                            label={`${u.supervisor.name} ${u.supervisor.last_name}`}
                            size="small"
                            sx={{
                              fontSize: "0.7rem",
                              fontWeight: 500,
                              bgcolor: "rgba(139,92,246,0.1)",
                              color: "#8b5cf6",
                            }}
                          />
                        ) : (
                          <Typography fontSize="0.75rem" color="text.disabled">
                            Sin asignar
                          </Typography>
                        )}
                      </TableCell>

                      {/* Acciones */}
                      {(canEdit || canAssign) && (
                        <TableCell>
                          <Box sx={{ display: "flex", gap: 0.5 }}>
                            {/* Editar — solo superadmin/admin */}
                            {canEdit && (
                              <Tooltip title="Editar">
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenEdit(u)}
                                  sx={{
                                    "&:hover": {
                                      color: "primary.main",
                                      bgcolor: "rgba(99,102,241,0.06)",
                                    },
                                  }}
                                >
                                  <Edit fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}

                            {/* Asignar supervisor — solo para usuarios (role_id 4) */}
                            {canAssign && u.role_id === 4 && (
                              <Tooltip
                                title={
                                  u.supervisor
                                    ? "Cambiar supervisor"
                                    : "Asignar supervisor"
                                }
                              >
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenAssign(u)}
                                  sx={{
                                    "&:hover": {
                                      color: "#8b5cf6",
                                      bgcolor: "rgba(139,92,246,0.06)",
                                    },
                                  }}
                                >
                                  <ManageAccounts fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}

                            {/* Eliminar — solo superadmin/admin */}
                            {canEdit && (
                              <Tooltip title="Eliminar">
                                <IconButton
                                  size="small"
                                  onClick={() => handleDelete(u.id)}
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
                            )}
                          </Box>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={filtered.length}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25, 50]}
          labelRowsPerPage="Filas por página:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}–${to} de ${count}`
          }
          sx={{ borderTop: "1px solid #e2e8f0" }}
        />
      </Paper>

      {/* Modal crear/editar */}
      <UserFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        user={selectedUser}
        onSuccess={fetchUsers}
      />

      {/* Modal asignar supervisor */}
      <AssignSupervisorModal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        user={assignUser}
        onSuccess={fetchUsers}
      />
    </Box>
  );
}
