import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import type { ModuleCard as ModuleCardType } from "../../types/api";
import { formatDuration } from "../../utils/format";

const statusColorMap: Record<string, "default" | "primary" | "warning" | "success" | "error"> = {
  PENDING: "default",
  CREATED: "default",
  CONFIGURED: "default",
  RUNNING: "primary",
  WAITING: "warning",
  FINISHED: "success",
  INTERRUPTED: "error",
  ERROR: "error",
};

const resultColorMap: Record<string, "success" | "error" | "warning" | "default"> = {
  PASSED: "success",
  FAILED: "error",
  WARNING: "warning",
  SKIPPED: "default",
  REVIEW: "default",
  UNKNOWN: "default",
};

const statusBorderColorMap: Record<string, string> = {
  RUNNING: "primary.main",
  WAITING: "warning.main",
  INTERRUPTED: "error.main",
};

const resultBorderColorMap: Record<string, string> = {
  PASSED: "success.main",
  FAILED: "error.main",
  WARNING: "warning.main",
};

interface Props {
  card: ModuleCardType;
}

export default function ModuleCard({ card }: Props) {
  const isFinished = card.status === "FINISHED";
  const borderColor = isFinished
    ? resultBorderColorMap[card.result] || "divider"
    : statusBorderColorMap[card.status] || "divider";

  const isRunning = card.status === "RUNNING";
  const isWaiting = card.status === "WAITING";
  const isCreated = card.status === "CREATED";
  const isPulsing = isRunning || isWaiting || isCreated;
  const duration = formatDuration(card.durationMs);

  return (
    <Card
      variant="outlined"
      sx={{
        borderColor,
        transition: "border-color 0.3s",
        position: "relative",
        overflow: "hidden",
        minHeight: 92,
      }}
    >
      <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 }, display: "flex", flexDirection: "column", gap: 0.75 }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
          <Typography
            variant="body2"
            fontWeight="bold"
            title={card.name}
            sx={{
              flex: 1,
              minWidth: 0,
              lineHeight: 1.35,
              wordBreak: "break-all",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {card.name}
          </Typography>
          <Box sx={{ display: "flex", gap: 0.5, flexShrink: 0, alignItems: "center" }}>
            <Chip
              label={card.status}
              color={statusColorMap[card.status] || "default"}
              size="small"
              className={isPulsing ? "animate-pulse-opacity" : ""}
            />
            {card.result && (
              <Chip
                label={card.result}
                color={resultColorMap[card.result] || "default"}
                size="small"
                variant="outlined"
              />
            )}
          </Box>
        </Box>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            minHeight: "1.2em",
          }}
        >
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
          >
            {isWaiting && card.currentAction ? (
              <>
                <Box component="span" sx={{ color: "warning.main", fontWeight: 500 }}>
                  action ▸{" "}
                </Box>
                <Box component="span" sx={{ fontFamily: "Roboto Mono, monospace", fontSize: 11 }}>
                  {card.currentAction}
                </Box>
              </>
            ) : (
              card.lastMessage
            )}
          </Typography>
          {duration && (
            <Typography
              variant="caption"
              sx={{
                fontFamily: "Roboto Mono, monospace",
                fontSize: 11,
                color: "text.disabled",
                flexShrink: 0,
              }}
            >
              {duration}
            </Typography>
          )}
        </Box>
      </CardContent>
      {(isRunning || isCreated) && (
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 2,
            bgcolor: isCreated ? "rgba(187,222,251,0.10)" : "rgba(144,202,249,0.12)",
            overflow: "hidden",
          }}
        >
          <Box
            className="run-strip"
            sx={{
              position: "absolute",
              inset: 0,
              background: isCreated
                ? "linear-gradient(90deg, transparent 0%, #bbdefb 50%, transparent 100%)"
                : "linear-gradient(90deg, transparent 0%, #90caf9 50%, transparent 100%)",
            }}
          />
        </Box>
      )}
    </Card>
  );
}
