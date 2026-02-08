import { Link as RouterLink, useLocation } from "react-router-dom";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";

export default function TopBar() {
  const location = useLocation();
  const isDashboard = location.pathname === "/";

  return (
    <AppBar position="static" color="default" elevation={1}>
      <Toolbar variant="dense" sx={{ gap: 2 }}>
        <Typography variant="subtitle1" fontWeight="bold" color="primary">
          OIDC Autopilot
        </Typography>
        {isDashboard ? (
          <Button
            component={RouterLink}
            to="/config-manager"
            size="small"
            variant="outlined"
          >
            Config Manager
          </Button>
        ) : (
          <>
            <Button
              component={RouterLink}
              to="/"
              size="small"
              variant="outlined"
            >
              Dashboard
            </Button>
            <Typography variant="subtitle2">Config Manager</Typography>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
}
