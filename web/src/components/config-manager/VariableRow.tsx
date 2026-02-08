import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";

interface Props {
  keyName: string;
  value: string;
  onKeyChange: (newKey: string) => void;
  onValueChange: (newValue: string) => void;
  onDelete: () => void;
}

export default function VariableRow({
  keyName,
  value,
  onKeyChange,
  onValueChange,
  onDelete,
}: Props) {
  return (
    <Stack direction="row" spacing={0.75} sx={{ mb: 0.5, alignItems: "center" }}>
      <TextField
        value={keyName}
        placeholder="key"
        onChange={(e) => onKeyChange(e.target.value)}
        size="small"
        sx={{ flex: 1 }}
      />
      <TextField
        value={value}
        placeholder="value"
        onChange={(e) => onValueChange(e.target.value)}
        size="small"
        sx={{ flex: 1 }}
      />
      <IconButton size="small" color="error" onClick={onDelete}>
        <DeleteIcon fontSize="small" />
      </IconButton>
    </Stack>
  );
}
