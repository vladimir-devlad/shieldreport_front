import { Box, useMediaQuery, useTheme } from "@mui/material";
import { useState } from "react";
import { Outlet } from "react-router-dom";
import BottomNav from "./BottomNav";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function Layout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [collapsed, setCollapsed] = useState(false);

  const sidebarWidth = collapsed ? 68 : 240;

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f4f6fb" }}>
      {/* Sidebar solo en desktop */}
      {!isMobile && (
        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed((c) => !c)}
        />
      )}

      {/* Contenido principal */}
      <Box
        sx={{
          flex: 1,
          transition: "margin 0.25s ease",
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}
      >
        <Topbar
          sidebarWidth={isMobile ? 0 : sidebarWidth}
          isMobile={isMobile}
        />

        <Box
          sx={{
            flex: 1,
            p: { xs: 2, sm: 3 },
            pb: isMobile ? 9 : 3, // espacio para bottom nav
            mt: "64px",
          }}
        >
          <Outlet />
        </Box>
      </Box>

      {/* Bottom Navigation solo en móvil */}
      {isMobile && <BottomNav />}
    </Box>
  );
}
