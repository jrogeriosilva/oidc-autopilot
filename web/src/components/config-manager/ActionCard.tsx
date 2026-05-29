import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import type { ActionConfig } from "../../types/api";

interface Props {
  action: ActionConfig;
  onEdit: () => void;
  onDelete: () => void;
  active?: boolean;
  usageCount?: number;
}

function methodColor(method: string | undefined) {
  switch ((method || "POST").toUpperCase()) {
    case "GET":
      return "#90caf9";
    case "POST":
      return "#66bb6a";
    case "PUT":
      return "#ffa726";
    case "DELETE":
      return "#f44336";
    default:
      return "#90caf9";
  }
}

function ActionPreviewLine({ action }: { action: ActionConfig }) {
  if (action.type === "api") {
    return (
      <Box
        sx={{
          display: "flex",
          gap: 0.75,
          fontFamily: "Roboto Mono, monospace",
          fontSize: 11.5,
          color: "text.secondary",
          minWidth: 0,
        }}
      >
        <Box component="span" sx={{ color: methodColor(action.method), fontWeight: 700, flexShrink: 0 }}>
          {action.method || "POST"}
        </Box>
        <Box
          component="span"
          sx={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            minWidth: 0,
          }}
        >
          {action.endpoint || "(no endpoint)"}
        </Box>
      </Box>
    );
  }
  return (
    <Box
      sx={{
        display: "flex",
        gap: 0.75,
        fontFamily: "Roboto Mono, monospace",
        fontSize: 11.5,
        color: "text.secondary",
        minWidth: 0,
      }}
    >
      <Box component="span" sx={{ color: "success.main", fontWeight: 700, flexShrink: 0 }}>
        {action.operation || "navigate"}
      </Box>
      <Box
        component="span"
        sx={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          minWidth: 0,
        }}
      >
        {action.url || "(no url)"}
      </Box>
    </Box>
  );
}

export default function ActionCard({ action, onEdit, onDelete, active, usageCount = 0 }: Props) {
  return (
    <Paper
      variant="outlined"
      onClick={onEdit}
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 0.5,
        px: 1.25,
        py: 1,
        mb: 0.75,
        cursor: "pointer",
        transition: "border-color 0.2s, background 0.2s",
        "&:hover": { borderColor: "primary.main" },
        ...(active
          ? { borderColor: "primary.main", bgcolor: "rgba(144,202,249,0.08)" }
          : {}),
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
        <Typography
          variant="body2"
          fontWeight="bold"
          sx={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}
        >
          {action.name || "(unnamed)"}
        </Typography>
        <Chip
          label={action.type}
          size="small"
          color={action.type === "api" ? "primary" : "success"}
        />
        {usageCount > 0 && (
          <Box
            title={`Used by ${usageCount} module${usageCount === 1 ? "" : "s"}`}
            sx={{
              fontSize: 10.5,
              color: "text.disabled",
              fontFamily: "Roboto Mono, monospace",
              border: 1,
              borderColor: "rgba(255,255,255,0.23)",
              borderRadius: 4,
              px: 0.75,
            }}
          >
            ×{usageCount}
          </Box>
        )}
        <IconButton
          size="small"
          color="error"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          title="remove"
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      <ActionPreviewLine action={action} />
    </Paper>
  );
}
