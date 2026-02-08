import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Checkbox from "@mui/material/Checkbox";
import Button from "@mui/material/Button";
import AddIcon from "@mui/icons-material/Add";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import type { ActionConfig, ModuleConfig } from "../../types/api";
import VariableRow from "./VariableRow";
import { useDragReorder } from "../../hooks/useDragReorder";

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
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
        {module.name}
      </Typography>

      {allActions.length > 0 && (
        <>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1, mb: 0.5 }}>
            Assigned Actions:
          </Typography>
          <div>
            {checkedNames.map((name, i) => (
              <Box
                key={name}
                draggable
                onDragStart={(e) => drag.onDragStart(e, i)}
                onDragEnd={drag.onDragEnd}
                onDragOver={(e) => drag.onDragOver(e, i)}
                onDragLeave={drag.onDragLeave}
                onDrop={(e) => drag.onDrop(e, i)}
                sx={{ display: "flex", alignItems: "center", gap: 0.75, py: 0.5 }}
              >
                <DragIndicatorIcon
                  fontSize="small"
                  sx={{ color: "text.disabled", cursor: "grab", flexShrink: 0 }}
                />
                <Checkbox
                  checked
                  size="small"
                  onChange={() => handleToggle(name, false)}
                />
                <Typography variant="body2">{name}</Typography>
              </Box>
            ))}
          </div>
          {uncheckedNames.map((name) => (
            <Box
              key={name}
              sx={{ display: "flex", alignItems: "center", gap: 0.75, py: 0.5 }}
            >
              <Box sx={{ width: 24, flexShrink: 0 }} />
              <Checkbox
                checked={false}
                size="small"
                onChange={() => handleToggle(name, true)}
              />
              <Typography variant="body2">{name}</Typography>
            </Box>
          ))}
        </>
      )}

      <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1, mb: 0.5 }}>
        Module Variables:
      </Typography>
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
      <Button
        fullWidth
        variant="outlined"
        size="small"
        startIcon={<AddIcon />}
        onClick={handleAddVar}
        sx={{ mt: 0.5, borderStyle: "dashed" }}
      >
        Add Module Variable
      </Button>
    </div>
  );
}
