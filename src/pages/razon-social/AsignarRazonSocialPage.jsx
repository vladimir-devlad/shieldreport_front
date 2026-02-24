import { Add, ArrowBack, Remove, Search } from "@mui/icons-material";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Checkbox,
  Chip,
  IconButton,
  InputAdornment,
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
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  assignRazonSocial,
  getRazonSocialByUser,
  removeRazonSocial,
} from "../../api/razonSocialApi";
import { getUsers } from "../../api/usersApi";

export default function AsignarRazonSocialPage() {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const rs = state?.rs;

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [assigning, setAssigning] = useState(null); // user id procesando

  // Mapa de userId → tiene esta RS asignada
  const [assignedMap, setAssignedMap] = useState({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: allUsers } = await getUsers();

      // Para cada usuario verificamos si tiene esta RS asignada
      const map = {};
      await Promise.all(
        allUsers.map(async (u) => {
          try {
            const { data: rsUser } = await getRazonSocialByUser(u.id);
            map[u.id] = rsUser.some((r) => r.id === Number(id));
          } catch {
            map[u.id] = false;
          }
        }),
      );

      setUsers(allUsers);
      setAssignedMap(map);
    } catch {
      setError("No se pudieron cargar los usuarios");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleToggleAssign = async (user) => {
    setAssigning(user.id);
    setError(null);
    try {
      if (assignedMap[user.id]) {
        // Quitar asignación
        await removeRazonSocial(user.id, Number(id));
        setAssignedMap((prev) => ({ ...prev, [user.id]: false }));
      } else {
        // Asignar
        await assignRazonSocial({
          user_id: user.id,
          razon_social_ids: [Number(id)],
        });
        setAssignedMap((prev) => ({ ...prev, [user.id]: true }));
      }
    } catch (err) {
      setError(
        err.response?.data?.detail || "Error al actualizar la asignación",
      );
    } finally {
      setAssigning(null);
    }
  };

  const filtered = users.filter(
    (u) =>
      !search ||
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      `${u.name} ${u.last_name}`.toLowerCase().includes(search.toLowerCase()),
  );

  const assignedCount = Object.values(assignedMap).filter(Boolean).length;

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
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Asignar Razón Social
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.25}>
            {rs?.name || `RS #${id}`} — {assignedCount} usuario(s) asignado(s)
          </Typography>
        </Box>
      </Stack>

      {/* Info RS */}
      <Paper
        sx={{
          p: 2,
          mb: 2.5,
          borderRadius: 3,
          bgcolor: "rgba(99,102,241,0.04)",
          border: "1px solid rgba(99,102,241,0.15)",
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography color="#fff" fontWeight={700} fontSize="1rem">
              {rs?.name?.[0]?.toUpperCase() || "R"}
            </Typography>
          </Box>
          <Box>
            <Typography fontWeight={600}>
              {rs?.name || `Razón Social #${id}`}
            </Typography>
            <Chip
              label="Activa"
              size="small"
              sx={{
                fontSize: "0.65rem",
                fontWeight: 600,
                bgcolor: "rgba(16,185,129,0.1)",
                color: "#10b981",
                mt: 0.25,
              }}
            />
          </Box>
          <Box sx={{ ml: "auto", textAlign: "right" }}>
            <Typography fontSize="0.75rem" color="text.secondary">
              Usuarios asignados
            </Typography>
            <Typography fontWeight={700} fontSize="1.4rem" color="#6366f1">
              {assignedCount}
            </Typography>
          </Box>
        </Stack>
      </Paper>

      {/* Buscador */}
      <Paper sx={{ p: 2, mb: 2.5, borderRadius: 3 }}>
        <TextField
          size="small"
          fullWidth
          placeholder="Buscar usuario por nombre o username..."
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
                  "Asignado",
                  "Usuario",
                  "Nombre",
                  "Rol",
                  "Estado",
                  "Acción",
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
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton variant="text" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    align="center"
                    sx={{ py: 4, color: "text.secondary" }}
                  >
                    No se encontraron usuarios
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((u) => {
                  const isAssigned = assignedMap[u.id] || false;
                  const isLoading = assigning === u.id;
                  return (
                    <TableRow
                      key={u.id}
                      sx={{
                        "&:hover": { bgcolor: "#f8f9ff" },
                        "&:last-child td": { border: 0 },
                        bgcolor: isAssigned
                          ? "rgba(99,102,241,0.03)"
                          : "transparent",
                      }}
                    >
                      <TableCell>
                        <Checkbox
                          checked={isAssigned}
                          disabled={isLoading}
                          onChange={() => handleToggleAssign(u)}
                          sx={{ "&.Mui-checked": { color: "#6366f1" }, p: 0 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Avatar
                            sx={{
                              width: 30,
                              height: 30,
                              fontSize: "0.75rem",
                              bgcolor: isAssigned ? "#6366f1" : "#e2e8f0",
                              color: isAssigned ? "#fff" : "#9ca3af",
                            }}
                          >
                            {u.name?.[0]?.toUpperCase()}
                          </Avatar>
                          <Typography fontSize="0.875rem" fontWeight={500}>
                            @{u.username}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.875rem" }}>
                        {u.name} {u.last_name}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={u.role?.name || u.role_id}
                          size="small"
                          sx={{
                            fontSize: "0.65rem",
                            fontWeight: 600,
                            textTransform: "capitalize",
                          }}
                        />
                      </TableCell>
                      <TableCell>
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
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          variant={isAssigned ? "outlined" : "contained"}
                          startIcon={
                            isAssigned ? (
                              <Remove fontSize="small" />
                            ) : (
                              <Add fontSize="small" />
                            )
                          }
                          disabled={isLoading}
                          onClick={() => handleToggleAssign(u)}
                          sx={{
                            borderRadius: 2,
                            fontSize: "0.75rem",
                            px: 1.5,
                            ...(isAssigned
                              ? {
                                  borderColor: "#e2e8f0",
                                  color: "error.main",
                                  "&:hover": {
                                    borderColor: "error.main",
                                    bgcolor: "rgba(239,68,68,0.06)",
                                  },
                                }
                              : {
                                  background:
                                    "linear-gradient(135deg, #6366f1, #8b5cf6)",
                                }),
                          }}
                        >
                          {isLoading
                            ? "..."
                            : isAssigned
                              ? "Quitar"
                              : "Asignar"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
