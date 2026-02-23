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
  Button,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const recentData = [
  {
    id: 1,
    name: "Carlos Méndez",
    action: "Registro nuevo",
    date: "2026-02-20",
    status: "Activo",
  },
  {
    id: 2,
    name: "Ana Torres",
    action: "Actualización",
    date: "2026-02-19",
    status: "Activo",
  },
  {
    id: 3,
    name: "Luis Ramírez",
    action: "Registro nuevo",
    date: "2026-02-18",
    status: "Inactivo",
  },
  {
    id: 4,
    name: "María Castillo",
    action: "Cierre de sesión",
    date: "2026-02-18",
    status: "Activo",
  },
  {
    id: 5,
    name: "Jorge Palomino",
    action: "Actualización",
    date: "2026-02-17",
    status: "Activo",
  },
];

const DashboardPage = () => {
  const exportToExcel = () => {
    // ====== Encabezado Corporativo ======
    const header = [
      ["EMPRESA XYZ S.A.C."],
      ["Reporte de Actividad Reciente"],
      [`Fecha de generación: ${new Date().toLocaleDateString()}`],
      [],
    ];

    // ====== Datos formateados ======
    const data = recentData.map((item) => ({
      ID: item.id,
      Nombre: item.name,
      Acción: item.action,
      Fecha: new Date(item.date).toLocaleDateString(),
      Estado: item.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data, { origin: "A5" });

    // Insertar encabezado arriba
    XLSX.utils.sheet_add_aoa(worksheet, header, { origin: "A1" });

    // ====== Ajustar ancho automático ======
    worksheet["!cols"] = [
      { wch: 8 }, // ID
      { wch: 20 }, // Nombre
      { wch: 20 }, // Acción
      { wch: 15 }, // Fecha
      { wch: 15 }, // Estado
    ];

    // ====== Crear libro ======
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Actividad");

    // ====== Generar archivo ======
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const fileData = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    });

    saveAs(fileData, "reporte_actividad.xlsx");
  };

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        {/* Lado izquierdo */}
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Resumen general del sistema
          </Typography>
        </Box>

        {/* Lado derecho */}
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={exportToExcel}
        >
          Descargar Excel
        </Button>
      </Box>

      <Paper sx={{ borderRadius: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Nombre</TableCell>
                <TableCell>Acción</TableCell>
                <TableCell>Fecha</TableCell>
                <TableCell>Estado</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {recentData.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.id}</TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>{row.name}</TableCell>
                  <TableCell>{row.action}</TableCell>
                  <TableCell>
                    {new Date(row.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={row.status}
                      size="small"
                      sx={{
                        bgcolor:
                          row.status === "Activo"
                            ? "rgba(16,185,129,0.1)"
                            : "rgba(156,163,175,0.15)",
                        color: row.status === "Activo" ? "#10b981" : "#9ca3af",
                        fontWeight: 600,
                        fontSize: "0.7rem",
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default DashboardPage;
