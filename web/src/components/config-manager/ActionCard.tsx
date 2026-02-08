import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import type { ActionConfig } from "../../types/api";

interface Props {
  action: ActionConfig;
  onEdit: () => void;
  onDelete: () => void;
}

export default function ActionCard({ action, onEdit, onDelete }: Props) {
  return (
    <Paper
      variant="outlined"
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        px: 1.5,
        py: 1,
        mb: 0.75,
        cursor: "pointer",
        "&:hover": { borderColor: "primary.main" },
        transition: "border-color 0.2s",
      }}
      onClick={onEdit}
    >
      <Typography
        variant="body2"
        fontWeight="bold"
        sx={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
      >
        {action.name || "(unnamed)"}
      </Typography>
      <Chip
        label={action.type}
        size="small"
        color={action.type === "api" ? "primary" : "success"}
      />
      <Box sx={{ display: "flex", gap: 0.5 }} onClick={(e) => e.stopPropagation()}>
        <Button size="small" onClick={onEdit}>
          edit
        </Button>
        <IconButton size="small" color="error" onClick={onDelete}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
    </Paper>
  );
}
