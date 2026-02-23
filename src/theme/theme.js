import { createTheme } from "@mui/material";

const theme = createTheme({
  palette: {
    primary: {
      main: "#6366f1",
      dark: "#4f46e5",
      light: "#818cf8",
    },
    secondary: {
      main: "#8b5cf6",
    },
    background: {
      default: "#f4f6fb",
      paper: "#ffffff",
    },
    text: {
      primary: "#111827",
      secondary: "#6b7280",
    },
    success: { main: "#10b981" },
    error: { main: "#ef4444" },
  },
  typography: {
    fontFamily: "'Roboto', system-ui, sans-serif",
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 600 },
    button: { textTransform: "none", fontWeight: 600 },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          boxShadow: "none",
          "&:hover": { boxShadow: "none" },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
          border: "1px solid #e8eaf0",
        },
      },
    },
  },
});

export default theme;
