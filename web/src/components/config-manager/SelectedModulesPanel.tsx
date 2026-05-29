import { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Checkbox from "@mui/material/Checkbox";
import IconButton from "@mui/material/IconButton";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import CloseIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import type { ActionConfig, ModuleConfig } from "../../types/api";

interface Props {
  modules: ModuleConfig[];
  allActions: ActionConfig[];
  expandedIndex: number | null;
  onSetExpandedIndex: (index: number | null) => void;
  onReorder: (from: number, to: number) => void;
  onRemove: (index: number) => void;
  onChangeActions: (index: number, actions: string[]) => void;
}

export default function SelectedModulesPanel({
  modules,
  allActions,
  expandedIndex,
  onSetExpandedIndex,
  onReorder,
  onRemove,
  onChangeActions,
}: Props) {
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  if (modules.length === 0) {
    return (
      <Box
        sx={{
          p: 3,
          fontSize: 13,
          color: "text.secondary",
          textAlign: "center",
          border: "1px dashed rgba(255,255,255,0.12)",
          borderRadius: 1,
        }}
      >
        <CheckBoxOutlineBlankIcon
          sx={{ display: "block", mx: "auto", mb: 0.75, color: "text.disabled" }}
        />
        No modules selected. Check modules above to add them.
      </Box>
    );
  }

  return (
    <Box
      sx={{
        maxHeight: 360,
        overflowY: "auto",
        border: 1,
        borderColor: "divider",
        borderRadius: 1,
      }}
    >
      {modules.map((mod, i) => {
        const expanded = expandedIndex === i;
        const actionCount = (mod.actions || []).length;
        const isDropTarget = overIdx === i && dragIdx != null && dragIdx !== i;
        const toggleAction = (name: string) => {
          const has = (mod.actions || []).includes(name);
          const next = has
            ? (mod.actions || []).filter((a) => a !== name)
            : [...(mod.actions || []), name];
          onChangeActions(i, next);
        };
        return (
          <Box
            key={mod.name}
            draggable={!expanded}
            onDragStart={() => setDragIdx(i)}
            onDragEnd={() => {
              setDragIdx(null);
              setOverIdx(null);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setOverIdx(i);
            }}
            onDrop={() => {
              if (dragIdx != null && dragIdx !== i) onReorder(dragIdx, i);
              setDragIdx(null);
              setOverIdx(null);
            }}
            sx={{
              borderBottom: i < modules.length - 1 ? 1 : 0,
              borderColor: "divider",
              borderTop: isDropTarget ? "2px solid #58a6ff" : "none",
              bgcolor: expanded ? "rgba(144,202,249,0.04)" : "transparent",
              opacity: dragIdx === i ? 0.4 : 1,
              transition: "background 150ms",
            }}
          >
            <Box
              onClick={() => onSetExpandedIndex(expanded ? null : i)}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.75,
                px: 1.5,
                py: 0.75,
                cursor: "pointer",
                "&:hover": !expanded ? { bgcolor: "action.hover" } : {},
              }}
            >
              <DragIndicatorIcon
                fontSize="small"
                sx={{ color: "text.disabled", cursor: "grab", flexShrink: 0 }}
              />
              <Typography
                variant="body2"
                fontWeight="medium"
                sx={{
                  flex: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  minWidth: 0,
                }}
              >
                {mod.name}
              </Typography>
              <Box
                component="span"
                sx={{
                  fontSize: 11.5,
                  color: actionCount === 0 ? "warning.main" : "text.secondary",
                  fontFamily: "Roboto Mono, monospace",
                  flexShrink: 0,
                }}
              >
                {actionCount} {actionCount === 1 ? "action" : "actions"}
              </Box>
              <ExpandMoreIcon
                fontSize="small"
                sx={{
                  color: "text.secondary",
                  transition: "transform 200ms",
                  transform: expanded ? "rotate(180deg)" : "none",
                  flexShrink: 0,
                }}
              />
              <IconButton
                size="small"
                color="error"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(i);
                }}
                title="remove"
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
            {expanded && (
              <Box
                sx={{
                  px: 1.5,
                  pl: 4.5,
                  py: 1,
                  pb: 1.5,
                  borderTop: 1,
                  borderColor: "rgba(255,255,255,0.08)",
                }}
              >
                {allActions.length === 0 ? (
                  <Typography variant="caption" color="text.disabled">
                    Define actions in the left column to attach them here.
                  </Typography>
                ) : (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
                    {allActions.map((a) => {
                      const checked = (mod.actions || []).includes(a.name);
                      return (
                        <Box
                          key={a.name}
                          component="label"
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.75,
                            cursor: "pointer",
                            px: 0.75,
                            py: 0.5,
                            borderRadius: 1,
                            "&:hover": { bgcolor: "rgba(255,255,255,0.04)" },
                          }}
                        >
                          <Checkbox
                            size="small"
                            checked={checked}
                            onChange={() => toggleAction(a.name)}
                          />
                          <Typography
                            variant="body2"
                            sx={{ flex: 1, fontFamily: "Roboto Mono, monospace" }}
                          >
                            {a.name}
                          </Typography>
                          <Chip
                            label={a.type}
                            size="small"
                            color={a.type === "api" ? "primary" : "success"}
                          />
                        </Box>
                      );
                    })}
                  </Box>
                )}
              </Box>
            )}
          </Box>
        );
      })}
    </Box>
  );
}
