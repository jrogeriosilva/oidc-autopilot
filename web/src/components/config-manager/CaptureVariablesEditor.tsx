import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";

interface Props {
  vars: string[];
  onChange: (vars: string[]) => void;
}

export default function CaptureVariablesEditor({ vars, onChange }: Props) {
  const handleChange = (index: number, value: string) => {
    const updated = [...vars];
    updated[index] = value.trim();
    onChange(updated);
  };

  const handleDelete = (index: number) => {
    onChange(vars.filter((_, i) => i !== index));
  };

  const handleAdd = () => {
    onChange([...vars, ""]);
  };

  return (
    <>
      {vars.map((v, i) => (
        <Stack key={i} direction="row" spacing={0.75} sx={{ mb: 0.5, alignItems: "center" }}>
          <TextField
            value={v}
            placeholder="variable name"
            onChange={(e) => handleChange(i, e.target.value)}
            size="small"
            fullWidth
          />
          <IconButton size="small" color="error" onClick={() => handleDelete(i)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
      ))}
      <Button
        fullWidth
        variant="outlined"
        size="small"
        startIcon={<AddIcon />}
        onClick={handleAdd}
        sx={{ mt: 0.5, borderStyle: "dashed" }}
      >
        Add Capture Variable
      </Button>
    </>
  );
}
