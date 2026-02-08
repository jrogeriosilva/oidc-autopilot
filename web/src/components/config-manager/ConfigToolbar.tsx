import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Chip from "@mui/material/Chip";
import { fetchConfigs } from "../../api/client";

interface Props {
  filename: string;
  dirty: boolean;
  onNew: () => void;
  onLoad: (filename: string) => void;
  onSave: () => void;
  onDelete: (filename: string) => void;
  onFilenameChange: (filename: string) => void;
}

export default function ConfigToolbar({
  filename,
  dirty,
  onNew,
  onLoad,
  onSave,
  onDelete,
  onFilenameChange,
}: Props) {
  const [configFiles, setConfigFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState("");

  const refreshConfigs = () => {
    fetchConfigs()
      .then((d) => setConfigFiles(d.files))
      .catch(() => {});
  };

  useEffect(() => {
    refreshConfigs();
  }, []);

  useEffect(() => {
    refreshConfigs();
  }, [dirty]);

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        px: 3,
        py: 1,
        bgcolor: "background.paper",
        borderBottom: 1,
        borderColor: "divider",
        flexWrap: "wrap",
      }}
    >
      <Button variant="outlined" size="small" onClick={onNew}>
        New
      </Button>
      <TextField
        select
        value={selectedFile}
        onChange={(e) => setSelectedFile(e.target.value)}
        size="small"
        sx={{ minWidth: 180 }}
      >
        <MenuItem value="">
          <em>-- select config --</em>
        </MenuItem>
        {configFiles.map((f) => (
          <MenuItem key={f} value={f}>
            {f}
          </MenuItem>
        ))}
      </TextField>
      <Button variant="outlined" size="small" onClick={() => onLoad(selectedFile)}>
        Load
      </Button>
      <Button variant="contained" color="success" size="small" onClick={onSave}>
        Save
      </Button>
      <Button
        variant="contained"
        color="error"
        size="small"
        onClick={() => onDelete(selectedFile || filename)}
      >
        Delete
      </Button>
      <TextField
        value={filename}
        onChange={(e) => onFilenameChange(e.target.value)}
        placeholder="filename.config.json"
        size="small"
        sx={{ minWidth: 200 }}
      />
      {dirty && (
        <Chip label="unsaved" color="warning" size="small" />
      )}
    </Box>
  );
}
