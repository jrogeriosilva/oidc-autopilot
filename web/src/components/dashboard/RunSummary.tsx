import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import LinearProgress from "@mui/material/LinearProgress";
import StopIcon from "@mui/icons-material/Stop";
import ReplayIcon from "@mui/icons-material/Replay";
import ScheduleIcon from "@mui/icons-material/Schedule";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import type { ModuleCard, ExecutionSummary } from "../../types/api";
import { formatDuration } from "../../utils/format";

interface Props {
  status: "idle" | "running" | "done" | "errored" | "stopped";
  cards: ModuleCard[];
  outcome: ExecutionSummary | null;
  elapsedMs: number;
  onStop: () => void;
  onRerun: () => void;
  stopping?: boolean;
}

const statusBadge: Record<
  string,
  { color: "default" | "primary" | "success" | "error"; label: string; pulse?: boolean }
> = {
  idle: { color: "default", label: "Idle" },
  running: { color: "primary", label: "Running", pulse: true },
  done: { color: "success", label: "Done" },
  errored: { color: "error", label: "Failed" },
  stopped: { color: "error", label: "Stopped" },
};

export default function RunSummary({
  status,
  cards,
  outcome,
  elapsedMs,
  onStop,
  onRerun,
  stopping,
}: Props) {
  const badge = statusBadge[status];
  const total = cards.length;

  // Derive counts from cards when no final outcome is available yet.
  const liveCounts = cards.reduce(
    (acc, c) => {
      if (c.result === "PASSED") acc.passed++;
      else if (c.result === "FAILED" || c.status === "INTERRUPTED") acc.failed++;
      else if (c.result === "WARNING") acc.warning++;
      if (c.status === "RUNNING" || c.status === "WAITING") acc.active++;
      return acc;
    },
    { passed: 0, failed: 0, warning: 0, active: 0 },
  );

  const passed = outcome?.passed ?? liveCounts.passed;
  const failed = outcome?.failed ?? liveCounts.failed;
  const warning = outcome?.warning ?? liveCounts.warning;
  const finished = passed + failed + warning + (outcome?.interrupted ?? 0);
  const pct = total ? Math.round((finished / total) * 100) : 0;
  const active = liveCounts.active;

  const progressColor =
    status === "done" && failed === 0
      ? "success"
      : status === "stopped" || failed > 0
        ? "error"
        : "primary";

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        px: 3,
        py: 1,
        bgcolor: "background.paper",
        borderBottom: 1,
        borderColor: "divider",
        flexShrink: 0,
      }}
    >
      <Chip
        label={badge.label}
        color={badge.color}
        size="small"
        className={badge.pulse ? "animate-pulse-opacity" : ""}
      />

      <Box sx={{ flex: 1, display: "flex", alignItems: "center", gap: 1.5, minWidth: 240 }}>
        <LinearProgress
          variant="determinate"
          value={pct}
          color={progressColor}
          sx={{ flex: 1, maxWidth: 360, height: 6, borderRadius: 1 }}
        />
        <Typography
          variant="caption"
          sx={{ fontFamily: "Roboto Mono, monospace", minWidth: 56 }}
        >
          {finished}/{total}{" "}
          <Box component="span" sx={{ color: "text.disabled" }}>
            ({pct}%)
          </Box>
        </Typography>
      </Box>

      <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
        {active > 0 && (
          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, color: "primary.main", fontSize: 12 }}>
            <Box
              className="animate-pulse-opacity"
              sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "primary.main" }}
            />
            {active} active
          </Box>
        )}
        {passed > 0 && (
          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, color: "success.main", fontSize: 12 }}>
            <CheckCircleIcon sx={{ fontSize: 14 }} />
            {passed} passed
          </Box>
        )}
        {failed > 0 && (
          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, color: "error.main", fontSize: 12, fontWeight: 500 }}>
            <CancelIcon sx={{ fontSize: 14 }} />
            {failed} failed
          </Box>
        )}
        {warning > 0 && (
          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, color: "warning.main", fontSize: 12 }}>
            <WarningAmberIcon sx={{ fontSize: 14 }} />
            {warning} warn
          </Box>
        )}
      </Box>

      <Box
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 0.5,
          color: "text.secondary",
          fontFamily: "Roboto Mono, monospace",
          fontSize: 12,
          minWidth: 70,
          justifyContent: "flex-end",
        }}
      >
        <ScheduleIcon sx={{ fontSize: 14 }} />
        {formatDuration(elapsedMs) || "0s"}
      </Box>

      {status === "running" ? (
        <Button
          variant="contained"
          color="error"
          size="small"
          startIcon={<StopIcon fontSize="small" />}
          onClick={onStop}
          disabled={stopping}
        >
          Stop
        </Button>
      ) : status === "idle" ? null : (
        <Button
          variant="outlined"
          size="small"
          startIcon={<ReplayIcon fontSize="small" />}
          onClick={onRerun}
        >
          Re-run
        </Button>
      )}
    </Box>
  );
}
