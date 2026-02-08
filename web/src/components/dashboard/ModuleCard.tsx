import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import type { ModuleCard as ModuleCardType } from "../../types/api";

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
  WAITING: "primary.main",
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

  const isPulsing = card.status === "RUNNING" || card.status === "WAITING";

  return (
    <Card
      variant="outlined"
      sx={{ borderColor, transition: "border-color 0.3s" }}
    >
      <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          <Typography
            variant="body2"
            fontWeight="bold"
            sx={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
            title={card.name}
          >
            {card.name}
          </Typography>
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
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            display: "block",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            mt: 0.5,
            minHeight: "1em",
          }}
        >
          {card.lastMessage}
        </Typography>
      </CardContent>
    </Card>
  );
}
