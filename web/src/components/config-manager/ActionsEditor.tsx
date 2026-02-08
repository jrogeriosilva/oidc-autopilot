import type { ActionConfig } from "../../types/api";
import ActionCard from "./ActionCard";
import ActionEditorPanel from "./ActionEditorPanel";

interface Props {
  actions: ActionConfig[];
  editingIndex: number;
  onSetActions: (actions: ActionConfig[]) => void;
  onSetEditing: (index: number) => void;
  onUpdateAction: (index: number, action: ActionConfig) => void;
}

export default function ActionsEditor({
  actions,
  editingIndex,
  onSetActions,
  onSetEditing,
  onUpdateAction,
}: Props) {
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
          onEdit={() => onSetEditing(i)}
          onDelete={() => handleDelete(i)}
        />
      ))}
      <button
        type="button"
        onClick={handleAdd}
        className="w-full mt-1 py-1 bg-transparent border border-dashed border-border rounded text-text-secondary text-[0.78rem] text-center cursor-pointer hover:border-accent hover:text-accent"
      >
        + Add Action
      </button>
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
