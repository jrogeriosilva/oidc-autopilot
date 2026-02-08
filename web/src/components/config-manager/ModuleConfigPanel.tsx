import type { ActionConfig, ModuleConfig } from "../../types/api";
import VariableRow from "./VariableRow";
import { useDragReorder } from "../../hooks/useDragReorder";
import { GripVertical } from "lucide-react";

interface Props {
  module: ModuleConfig;
  allActions: ActionConfig[];
  onChange: (module: ModuleConfig) => void;
}

export default function ModuleConfigPanel({
  module,
  allActions,
  onChange,
}: Props) {
  const assignedActions = module.actions || [];

  // Separate checked (assigned, in order) from unchecked
  const checkedNames = assignedActions.filter((name) =>
    allActions.some((a) => a.name === name),
  );
  const uncheckedNames = allActions
    .map((a) => a.name)
    .filter((name) => !checkedNames.includes(name));

  const handleReorder = (from: number, to: number) => {
    const newChecked = [...checkedNames];
    const [moved] = newChecked.splice(from, 1);
    newChecked.splice(to, 0, moved);
    onChange({ ...module, actions: newChecked });
  };

  const handleToggle = (name: string, checked: boolean) => {
    if (checked) {
      onChange({ ...module, actions: [...assignedActions, name] });
    } else {
      onChange({
        ...module,
        actions: assignedActions.filter((a) => a !== name),
      });
    }
  };

  const drag = useDragReorder(handleReorder);

  // Module variables
  const modVars = module.variables || {};
  const varKeys = Object.keys(modVars);

  const handleKeyChange = (oldKey: string, newKey: string) => {
    const trimmed = newKey.trim();
    if (!trimmed || trimmed === oldKey) return;
    const updated = { ...modVars };
    const val = updated[oldKey];
    delete updated[oldKey];
    updated[trimmed] = val;
    onChange({ ...module, variables: updated });
  };

  const handleValueChange = (key: string, value: string) => {
    onChange({ ...module, variables: { ...modVars, [key]: value } });
  };

  const handleDeleteVar = (key: string) => {
    const updated = { ...modVars };
    delete updated[key];
    onChange({ ...module, variables: updated });
  };

  const handleAddVar = () => {
    onChange({
      ...module,
      variables: { ...modVars, [`new_var_${Date.now()}`]: "" },
    });
  };

  return (
    <div>
      <div className="text-[0.78rem] text-text-secondary font-semibold mb-1">
        {module.name}
      </div>

      {/* Assigned actions */}
      {allActions.length > 0 && (
        <>
          <div className="text-[0.78rem] text-text-secondary font-semibold mt-2 mb-1">
            Assigned Actions:
          </div>
          {/* Draggable checked actions */}
          <div>
            {checkedNames.map((name, i) => (
              <div
                key={name}
                draggable
                onDragStart={(e) => drag.onDragStart(e, i)}
                onDragEnd={drag.onDragEnd}
                onDragOver={(e) => drag.onDragOver(e, i)}
                onDragLeave={drag.onDragLeave}
                onDrop={(e) => drag.onDrop(e, i)}
                className="flex items-center gap-1.5 py-1 text-[0.8rem]"
              >
                <GripVertical
                  size={14}
                  className="text-text-muted cursor-grab hover:text-text-secondary shrink-0"
                />
                <input
                  type="checkbox"
                  checked
                  onChange={() => handleToggle(name, false)}
                  className="m-0"
                />
                <span>{name}</span>
              </div>
            ))}
          </div>
          {/* Unchecked actions */}
          {uncheckedNames.map((name) => (
            <div
              key={name}
              className="flex items-center gap-1.5 py-1 text-[0.8rem]"
            >
              <span className="w-[24px] shrink-0" />
              <input
                type="checkbox"
                checked={false}
                onChange={() => handleToggle(name, true)}
                className="m-0"
              />
              <span>{name}</span>
            </div>
          ))}
        </>
      )}

      {/* Module variables */}
      <div className="text-[0.78rem] text-text-secondary font-semibold mt-2 mb-1">
        Module Variables:
      </div>
      {varKeys.map((key) => (
        <VariableRow
          key={key}
          keyName={key}
          value={modVars[key]}
          onKeyChange={(newKey) => handleKeyChange(key, newKey)}
          onValueChange={(val) => handleValueChange(key, val)}
          onDelete={() => handleDeleteVar(key)}
        />
      ))}
      <button
        type="button"
        onClick={handleAddVar}
        className="w-full mt-1 py-1 bg-transparent border border-dashed border-border rounded text-text-secondary text-[0.78rem] text-center cursor-pointer hover:border-accent hover:text-accent"
      >
        + Add Module Variable
      </button>
    </div>
  );
}
