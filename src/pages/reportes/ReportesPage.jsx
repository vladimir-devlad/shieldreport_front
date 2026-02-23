import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  TextField,
  MenuItem,
  InputAdornment,
  TablePagination,
  Skeleton,
  Alert,
  Stack,
  IconButton,
  Tooltip,
  Button,
} from "@mui/material";
import { Search, Refresh, FileDownload } from "@mui/icons-material";
import { getReportes } from "../../api/reportesApi";
import { getRazonesSociales } from "../../api/razonSocialApi";

// Columnas visibles
const COLUMNS = [
  { key: "razon_social_id", label: "Razon Social", width: 120 },
  { key: "sot", label: "SOT", width: 120 },
  { key: "fecha_fecgensot", label: "Fecha Gen.", width: 110 },
  { key: "hora_fecgensot", label: "Hora Gen.", width: 90 },
  { key: "proceso", label: "Proceso", width: 120 },
  { key: "tipo_trabajo", label: "Tipo Trabajo", width: 130 },
  { key: "sub_tipo_orden", label: "Sub Tipo", width: 120 },
  { key: "estado_sot", label: "Estado SOT", width: 120 },
  { key: "estado_agenda", label: "Estado Agenda", width: 130 },
  { key: "fecha_programada", label: "Fecha Prog.", width: 110 },
  { key: "region", label: "Región", width: 100 },
  { key: "departamento", label: "Departamento", width: 120 },
  { key: "provincia", label: "Provincia", width: 110 },
  { key: "distrito", label: "Distrito", width: 110 },
  { key: "franja", label: "Franja", width: 100 },
  { key: "lugar_venta", label: "Lugar Venta", width: 130 },
  { key: "tipopuntoventa", label: "Tipo PV", width: 110 },
  { key: "tipo_pdv", label: "Tipo PDV", width: 100 },
  { key: "pdv_region", label: "PDV Región", width: 110 },
  { key: "codusu", label: "Cód. Usuario", width: 110 },
  { key: "cargo", label: "Cargo", width: 110 },
  { key: "area", label: "Área", width: 100 },
  { key: "direccion", label: "Dirección", width: 160 },
  { key: "confirmacion", label: "Confirmación", width: 120 },
  { key: "tipo_venta", label: "Tipo Venta", width: 110 },
  { key: "tipo_programacion", label: "Tipo Prog.", width: 120 },
  { key: "dilacion", label: "Dilación", width: 100 },
  { key: "usuario_venta", label: "Usuario Venta", width: 130 },
  { key: "ovenc_codigo", label: "OVenc Código", width: 120 },
];

// Chips de color para estados
const estadoSotColor = (estado) => {
  const map = {
    COMPLETADO: { bgcolor: "rgba(16,185,129,0.1)", color: "#10b981" },
    PENDIENTE: { bgcolor: "rgba(245,158,11,0.1)", color: "#f59e0b" },
    ANULADO: { bgcolor: "rgba(239,68,68,0.1)", color: "#ef4444" },
    EN_PROCESO: { bgcolor: "rgba(99,102,241,0.1)", color: "#6366f1" },
  };
  return (
    map[estado?.toUpperCase()] || {
      bgcolor: "rgba(156,163,175,0.15)",
      color: "#9ca3af",
    }
  );
};

export default function ReportesPage() {
  const [reportes, setReportes] = useState([]);
  const [razonesSociales, setRazonesSociales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtros
  const [search, setSearch] = useState("");
  const [razonSocialId, setRazonSocialId] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("");

  // Paginación — viene del backend
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [total, setTotal] = useState(0);

  // Carga razones sociales para el filtro
  useEffect(() => {
    getRazonesSociales()
      .then(({ data }) => setRazonesSociales(data))
      .catch(() => {});
  }, []);

  const fetchReportes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        ...(razonSocialId && { razon_social_id: razonSocialId }),
        ...(search && { search }),
        ...(estadoFilter && { estado_sot: estadoFilter }),
      };
      const { data } = await getReportes(params);
      setReportes(data.data ?? data);
      setTotal(data.total ?? 0);
    } catch {
      setError("No se pudieron cargar los reportes");
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, razonSocialId, search, estadoFilter]);

  useEffect(() => {
    fetchReportes();
  }, [fetchReportes]);

  const handleClearFilters = () => {
    setSearch("");
    setRazonSocialId("");
    setEstadoFilter("");
    setPage(0);
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
            Reportes SOT
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.25}>
            {total > 0
              ? `${total.toLocaleString()} registros encontrados`
              : "Consulta de reportes del sistema"}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<FileDownload />}
          sx={{
            borderRadius: 2,
            borderColor: "#e2e8f0",
            color: "text.secondary",
          }}
        >
          Exportar
        </Button>
      </Box>

      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 2.5, borderRadius: 3 }}>
        <Stack spacing={2}>
          {/* Fila 1 */}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              size="small"
              placeholder="Buscar por SOT, código..."
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
            <TextField
              select
              size="small"
              label="Razón Social"
              value={razonSocialId}
              onChange={(e) => {
                setRazonSocialId(e.target.value);
                setPage(0);
              }}
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="">Todas</MenuItem>
              {razonesSociales.map((rs) => (
                <MenuItem key={rs.id} value={rs.id}>
                  {rs.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              label="Estado SOT"
              value={estadoFilter}
              onChange={(e) => {
                setEstadoFilter(e.target.value);
                setPage(0);
              }}
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="">Todos</MenuItem>
              {["COMPLETADO", "PENDIENTE", "ANULADO", "EN_PROCESO"].map((e) => (
                <MenuItem key={e} value={e}>
                  {e}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          {/* Fila 2 — fechas */}
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            alignItems="center"
          >
            <Button
              size="small"
              variant="text"
              color="inherit"
              onClick={handleClearFilters}
              sx={{ color: "text.secondary", fontSize: "0.8rem" }}
            >
              Limpiar filtros
            </Button>
            <Tooltip title="Refrescar">
              <IconButton
                onClick={fetchReportes}
                sx={{
                  border: "1px solid #e2e8f0",
                  borderRadius: 2,
                  ml: "auto",
                }}
              >
                <Refresh fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* Tabla con scroll horizontal */}
      <Paper sx={{ borderRadius: 3, overflow: "hidden" }}>
        <TableContainer
          sx={{ maxHeight: "calc(100vh - 380px)", overflowX: "auto" }}
        >
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    fontSize: "0.75rem",
                    color: "text.secondary",
                    bgcolor: "#f8fafc",
                    position: "sticky",
                    left: 0,
                    zIndex: 3,
                    borderRight: "1px solid #e2e8f0",
                    minWidth: 50,
                  }}
                >
                  #
                </TableCell>
                {COLUMNS.map((col) => (
                  <TableCell
                    key={col.key}
                    sx={{
                      fontWeight: 600,
                      fontSize: "0.75rem",
                      color: "text.secondary",
                      bgcolor: "#f8fafc",
                      minWidth: col.width,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {col.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: COLUMNS.length + 1 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton variant="text" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : reportes.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={COLUMNS.length + 1}
                    align="center"
                    sx={{ py: 6, color: "text.secondary" }}
                  >
                    No se encontraron reportes
                  </TableCell>
                </TableRow>
              ) : (
                reportes.map((row, index) => (
                  <TableRow
                    key={row.id}
                    sx={{
                      "&:hover": { bgcolor: "#f8f9ff" },
                      "&:last-child td": { border: 0 },
                    }}
                  >
                    {/* Número de fila — sticky */}
                    <TableCell
                      sx={{
                        fontSize: "0.75rem",
                        color: "text.secondary",
                        position: "sticky",
                        left: 0,
                        bgcolor: "white",
                        borderRight: "1px solid #e2e8f0",
                        zIndex: 1,
                      }}
                    >
                      {page * rowsPerPage + index + 1}
                    </TableCell>

                    {COLUMNS.map((col) => {
                      const value = row[col.key] ?? "—";

                      // Chips para estados
                      if (
                        col.key === "estado_sot" ||
                        col.key === "estado_agenda"
                      ) {
                        const colors = estadoSotColor(value);
                        return (
                          <TableCell
                            key={col.key}
                            sx={{ whiteSpace: "nowrap" }}
                          >
                            {value !== "—" ? (
                              <Chip
                                label={value}
                                size="small"
                                sx={{
                                  ...colors,
                                  fontSize: "0.65rem",
                                  fontWeight: 600,
                                }}
                              />
                            ) : (
                              <Typography
                                fontSize="0.75rem"
                                color="text.secondary"
                              >
                                —
                              </Typography>
                            )}
                          </TableCell>
                        );
                      }

                      return (
                        <TableCell
                          key={col.key}
                          sx={{
                            fontSize: "0.8rem",
                            whiteSpace: "nowrap",
                            color: "text.primary",
                          }}
                        >
                          {value}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Paginación — backend */}
        <TablePagination
          component="div"
          count={total}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value));
            setPage(0);
          }}
          rowsPerPageOptions={[25, 50, 100]}
          labelRowsPerPage="Filas por página:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}–${to} de ${count.toLocaleString()}`
          }
          sx={{ borderTop: "1px solid #e2e8f0" }}
        />
      </Paper>
    </Box>
  );
}
