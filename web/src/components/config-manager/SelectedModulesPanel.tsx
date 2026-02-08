import type { ModuleConfig } from "../../types/api";
import { useDragReorder } from "../../hooks/useDragReorder";
import { GripVertical } from "lucide-react";

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
      <div className="p-2 text-[0.78rem] text-text-secondary">
        No modules selected. Check modules above to add them.
      </div>
    );
  }

  return (
    <div className="max-h-[300px] overflow-y-auto border border-[#21262d] rounded bg-bg-input">
      {modules.map((mod, i) => (
        <div
          key={mod.name}
          draggable
          onDragStart={(e) => drag.onDragStart(e, i)}
          onDragEnd={drag.onDragEnd}
          onDragOver={(e) => drag.onDragOver(e, i)}
          onDragLeave={drag.onDragLeave}
          onDrop={(e) => drag.onDrop(e, i)}
          onClick={() => onSelect(mod.name)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 border-b border-[#21262d] last:border-b-0 text-[0.8rem] cursor-pointer hover:bg-bg-secondary transition-colors ${
            selectedName === mod.name ? "bg-blue-bg/20" : ""
          }`}
        >
          <GripVertical
            size={14}
            className="text-text-muted cursor-grab hover:text-text-secondary shrink-0"
          />
          <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap font-medium text-text-heading">
            {mod.name}
          </span>
          <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => onSelect(mod.name)}
              className="bg-transparent border border-border rounded text-text-secondary text-[0.72rem] px-2 py-0.5 cursor-pointer hover:text-text-primary hover:border-text-secondary"
            >
              config
            </button>
            <button
              type="button"
              onClick={() => onRemove(i)}
              className="bg-transparent border border-border rounded text-red text-xs px-2 py-0.5 cursor-pointer hover:text-[#ff7b72] hover:border-red"
            >
              x
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
