import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import { useDashboard } from "../hooks/useDashboard";
import LaunchForm from "../components/dashboard/LaunchForm";
import ModuleCardsGrid from "../components/dashboard/ModuleCardsGrid";
import LogDrawer from "../components/dashboard/LogDrawer";
import StatusCounters from "../components/dashboard/StatusCounters";

const statusChipMap: Record<
  string,
  { color: "default" | "primary" | "success" | "error"; label: string; pulse?: boolean }
> = {
  idle: { color: "default", label: "Idle" },
  running: { color: "primary", label: "Running", pulse: true },
  done: { color: "success", label: "Done" },
  errored: { color: "error", label: "Failed" },
  stopped: { color: "error", label: "Stopped" },
};

export default function DashboardPage() {
  const dashboard = useDashboard();
  const badge = statusChipMap[dashboard.status] || statusChipMap.idle;

  return (
    <>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          px: 3,
          py: 0.5,
          borderBottom: 1,
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <Chip
          label={badge.label}
          color={badge.color}
          size="small"
          className={badge.pulse ? "animate-pulse-opacity" : ""}
        />
        <StatusCounters outcome={dashboard.outcome} />
      </Box>

      <LaunchForm
        isRunning={dashboard.status === "running"}
        onLaunched={() => dashboard.setRunning()}
        onError={() => dashboard.setError()}
      />

      <Box component="section" sx={{ flex: 1, overflow: "auto", p: 2, px: 3 }}>
        <ModuleCardsGrid cards={dashboard.cards} />
      </Box>

      <LogDrawer logs={dashboard.logs} onClear={dashboard.clearLogs} />
    </>
  );
}
