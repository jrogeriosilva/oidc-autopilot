import type { ActionConfig } from "../../types/api";

interface Props {
  action: ActionConfig;
  onEdit: () => void;
  onDelete: () => void;
}

export default function ActionCard({ action, onEdit, onDelete }: Props) {
  const typeBadge =
    action.type === "api"
      ? "bg-blue-bg text-accent"
      : "bg-green-bg text-green";

  return (
    <div
      className="flex items-center gap-2 px-3 py-2 bg-bg-input border border-border rounded-md mb-1.5 cursor-pointer hover:border-accent transition-colors"
      onClick={onEdit}
    >
      <span className="flex-1 text-[0.82rem] font-semibold text-text-heading overflow-hidden text-ellipsis whitespace-nowrap">
        {action.name || "(unnamed)"}
      </span>
      <span
        className={`text-[0.65rem] px-2 py-0.5 rounded-xl font-semibold uppercase ${typeBadge}`}
      >
        {action.type}
      </span>
      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={onEdit}
          className="bg-transparent border border-border rounded text-text-secondary text-[0.72rem] px-2 py-0.5 cursor-pointer hover:text-text-primary hover:border-text-secondary"
        >
          edit
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="bg-transparent border border-border rounded text-red text-xs px-2 py-0.5 cursor-pointer hover:text-[#ff7b72] hover:border-red"
        >
          x
        </button>
      </div>
    </div>
  );
}
