import VariableRow from "./VariableRow";

interface Props {
  variables: Record<string, string>;
  onChange: (variables: Record<string, string>) => void;
}

export default function GlobalVariablesEditor({
  variables,
  onChange,
}: Props) {
  const keys = Object.keys(variables);

  const handleKeyChange = (oldKey: string, newKey: string) => {
    const trimmed = newKey.trim();
    if (!trimmed || trimmed === oldKey) return;
    const updated = { ...variables };
    const val = updated[oldKey];
    delete updated[oldKey];
    updated[trimmed] = val;
    onChange(updated);
  };

  const handleValueChange = (key: string, newValue: string) => {
    onChange({ ...variables, [key]: newValue });
  };

  const handleDelete = (key: string) => {
    const updated = { ...variables };
    delete updated[key];
    onChange(updated);
  };

  const handleAdd = () => {
    onChange({ ...variables, [`new_var_${Date.now()}`]: "" });
  };

  return (
    <>
      {keys.map((key) => (
        <VariableRow
          key={key}
          keyName={key}
          value={variables[key]}
          onKeyChange={(newKey) => handleKeyChange(key, newKey)}
          onValueChange={(val) => handleValueChange(key, val)}
          onDelete={() => handleDelete(key)}
        />
      ))}
      <button
        type="button"
        onClick={handleAdd}
        className="w-full mt-1 py-1 bg-transparent border border-dashed border-border rounded text-text-secondary text-[0.78rem] text-center cursor-pointer hover:border-accent hover:text-accent"
      >
        + Add Variable
      </button>
    </>
  );
}
