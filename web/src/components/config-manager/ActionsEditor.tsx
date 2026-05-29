import { useMemo } from "react";
import Button from "@mui/material/Button";
import AddIcon from "@mui/icons-material/Add";
import type { ActionConfig, ModuleConfig } from "../../types/api";
import ActionCard from "./ActionCard";
import ActionEditorPanel from "./ActionEditorPanel";

interface Props {
  actions: ActionConfig[];
  modules?: ModuleConfig[];
  editingIndex: number;
  onSetActions: (actions: ActionConfig[]) => void;
  onSetEditing: (index: number) => void;
  onUpdateAction: (index: number, action: ActionConfig) => void;
}

export default function ActionsEditor({
  actions,
  modules = [],
  editingIndex,
  onSetActions,
  onSetEditing,
  onUpdateAction,
}: Props) {
  const usage = useMemo(() => {
    const map: Record<string, number> = {};
    for (const m of modules) {
      for (const a of m.actions || []) map[a] = (map[a] || 0) + 1;
    }
    return map;
  }, [modules]);
  const handleAdd = () => {
    const newActions = [
      ...actions,
      { name: "", type: "api" as const, endpoint: "", method: "POST" },
    ];
    onSetActions(newActions);
    onSetEditing(newActions.length - 1);
  };

  const handleDelete = (index: number) => {
    const updated = actions.filter((_, i) => i !== index);
    onSetActions(updated);
    if (editingIndex === index) onSetEditing(-1);
  };

  return (
    <>
      {actions.map((action, i) => (
        <ActionCard
          key={i}
          action={action}
          onEdit={() => onSetEditing(editingIndex === i ? -1 : i)}
          onDelete={() => handleDelete(i)}
          active={editingIndex === i}
          usageCount={usage[action.name] || 0}
        />
      ))}
      <Button
        fullWidth
        variant="outlined"
        size="small"
        startIcon={<AddIcon />}
        onClick={handleAdd}
        sx={{ mt: 0.5, borderStyle: "dashed" }}
      >
        Add Action
      </Button>
      {editingIndex >= 0 && editingIndex < actions.length && (
        <ActionEditorPanel
          action={actions[editingIndex]}
          onChange={(a) => onUpdateAction(editingIndex, a)}
          onDone={() => onSetEditing(-1)}
        />
      )}
    </>
  );
}
