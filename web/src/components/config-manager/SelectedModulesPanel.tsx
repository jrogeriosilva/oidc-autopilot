import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import CloseIcon from "@mui/icons-material/Close";
import type { ModuleConfig } from "../../types/api";
import { useDragReorder } from "../../hooks/useDragReorder";

interface Props {
  modules: ModuleConfig[];
  selectedName: string | null;
  onReorder: (from: number, to: number) => void;
  onSelect: (name: string) => void;
  onRemove: (index: number) => void;
}

export default function SelectedModulesPanel({
  modules,
  selectedName,
  onReorder,
  onSelect,
  onRemove,
}: Props) {
  const drag = useDragReorder(onReorder);

  if (modules.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ p: 1 }}>
        No modules selected. Check modules above to add them.
      </Typography>
    );
  }

  return (
    <Box
      sx={{
        maxHeight: 300,
        overflowY: "auto",
        border: 1,
        borderColor: "divider",
        borderRadius: 1,
      }}
    >
      {modules.map((mod, i) => (
        <Box
          key={mod.name}
          draggable
          onDragStart={(e) => drag.onDragStart(e, i)}
          onDragEnd={drag.onDragEnd}
          onDragOver={(e) => drag.onDragOver(e, i)}
          onDragLeave={drag.onDragLeave}
          onDrop={(e) => drag.onDrop(e, i)}
          onClick={() => onSelect(mod.name)}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.75,
            px: 1.5,
            py: 0.75,
            borderBottom: 1,
            borderColor: "divider",
            cursor: "pointer",
            "&:last-child": { borderBottom: 0 },
            "&:hover": { bgcolor: "action.hover" },
            ...(selectedName === mod.name ? { bgcolor: "action.selected" } : {}),
          }}
        >
          <DragIndicatorIcon
            fontSize="small"
            sx={{ color: "text.disabled", cursor: "grab", flexShrink: 0 }}
          />
          <Typography
            variant="body2"
            fontWeight="medium"
            sx={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
          >
            {mod.name}
          </Typography>
          <Box sx={{ display: "flex", gap: 0.5, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
            <Button size="small" onClick={() => onSelect(mod.name)}>
              config
            </Button>
            <IconButton size="small" color="error" onClick={() => onRemove(i)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      ))}
    </Box>
  );
}
