import { Outlet } from "react-router-dom";
import Box from "@mui/material/Box";
import TopBar from "./TopBar";

export default function AppLayout() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <TopBar />
      <Outlet />
    </Box>
  );
}
