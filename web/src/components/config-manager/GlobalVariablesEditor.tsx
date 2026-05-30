import { useEffect, useState } from "react";
import Button from "@mui/material/Button";
import AddIcon from "@mui/icons-material/Add";
import VariableRow from "./VariableRow";

interface Props {
  variables: Record<string, string>;
  onChange: (variables: Record<string, string>) => void;
}

interface Row {
  id: string;
  key: string;
  value: string;
}

let rowIdSeq = 0;
const nextRowId = () => `var_${rowIdSeq++}`;

function recordToRows(record: Record<string, string>): Row[] {
  return Object.entries(record).map(([key, value]) => ({
    id: nextRowId(),
    key,
    value,
  }));
}

function rowsToRecord(rows: Row[]): Record<string, string> {
  const record: Record<string, string> = {};
  for (const row of rows) {
    const key = row.key.trim();
    // Skip empty keys; on a duplicate key, the last row wins.
    if (key) record[key] = row.value;
  }
  return record;
}

function sameRecord(a: Record<string, string>, b: Record<string, string>): boolean {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every((k) => a[k] === b[k]);
}

export default function GlobalVariablesEditor({
  variables,
  onChange,
}: Props) {
  // Rows carry a stable `id` so the React reconciliation key never depends on
  // the variable name/value being edited. Without this, renaming a key would
  // change the row's React key and remount the input, dropping focus.
  const [rows, setRows] = useState<Row[]>(() => recordToRows(variables));

  // Re-sync only when the incoming record genuinely differs from what these
  // rows represent (e.g. a config was loaded externally). Our own edits emit a
  // matching record, so this is a no-op for them and never clobbers in-progress
  // typing.
  useEffect(() => {
    setRows((prev) =>
      sameRecord(rowsToRecord(prev), variables) ? prev : recordToRows(variables)
    );
  }, [variables]);

  const emit = (next: Row[]) => {
    setRows(next);
    onChange(rowsToRecord(next));
  };

  const handleKeyChange = (id: string, key: string) =>
    emit(rows.map((row) => (row.id === id ? { ...row, key } : row)));

  const handleValueChange = (id: string, value: string) =>
    emit(rows.map((row) => (row.id === id ? { ...row, value } : row)));

  const handleDelete = (id: string) =>
    emit(rows.filter((row) => row.id !== id));

  const handleAdd = () =>
    emit([...rows, { id: nextRowId(), key: "", value: "" }]);

  return (
    <>
      {rows.map((row) => (
        <VariableRow
          key={row.id}
          keyName={row.key}
          value={row.value}
          onKeyChange={(newKey) => handleKeyChange(row.id, newKey)}
          onValueChange={(val) => handleValueChange(row.id, val)}
          onDelete={() => handleDelete(row.id)}
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
        Add Variable
      </Button>
    </>
  );
}
