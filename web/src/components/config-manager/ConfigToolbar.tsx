import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import SaveIcon from "@mui/icons-material/Save";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { fetchConfigs } from "../../api/client";

interface Props {
  filename: string;
  dirty: boolean;
  lastSavedAt: number | null;
  onNew: () => void;
  onLoad: (filename: string) => void;
  onSave: () => void;
  onDelete: (filename: string) => void;
  onFilenameChange: (filename: string) => void;
}

export function validateFilename(filename: string): { ok: boolean; msg: string | null } {
  if (!filename) return { ok: false, msg: "Filename is required" };
  if (!/^[A-Za-z0-9._-]+$/.test(filename))
    return { ok: false, msg: "Use letters, digits, ., _, - only" };
  if (!filename.endsWith(".config.json"))
    return { ok: false, msg: "Filename must end with .config.json" };
  return { ok: true, msg: null };
}

export default function ConfigToolbar({
  filename,
  dirty,
  lastSavedAt,
  onNew,
  onLoad,
  onSave,
  onDelete,
  onFilenameChange,
}: Props) {
  const [configFiles, setConfigFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState("");
  const [now, setNow] = useState(() => Date.now());

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

  // Tick once a second so the "saved Ns ago" stays fresh.
  useEffect(() => {
    if (dirty || !lastSavedAt) return;
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, [dirty, lastSavedAt]);

  const validation = validateFilename(filename);
  const canSave = validation.ok && dirty;
  const sinceSaved =
    lastSavedAt != null ? Math.max(0, Math.round((now - lastSavedAt) / 1000)) : null;

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "flex-start",
        gap: 1.5,
        px: 3,
        py: 1.25,
        bgcolor: "background.paper",
        borderBottom: 1,
        borderColor: "divider",
        flexWrap: "wrap",
        flexShrink: 0,
      }}
    >
      {/* Open group */}
      <Box sx={{ display: "flex", gap: 0.75, alignItems: "center" }}>
        <Button
          variant="outlined"
          size="small"
          startIcon={<AddIcon fontSize="small" />}
          onClick={onNew}
        >
          New
        </Button>
        <Box sx={{ height: 24, borderLeft: 1, borderColor: "divider", mx: 0.5 }} />
        <TextField
          select
          value={selectedFile}
          onChange={(e) => setSelectedFile(e.target.value)}
          size="small"
          sx={{ minWidth: 220 }}
        >
          <MenuItem value="">
            <em>-- open config --</em>
          </MenuItem>
          {configFiles.map((f) => (
            <MenuItem key={f} value={f}>
              {f}
            </MenuItem>
          ))}
        </TextField>
        <Button
          variant="outlined"
          size="small"
          startIcon={<FolderOpenIcon fontSize="small" />}
          onClick={() => onLoad(selectedFile)}
        >
          Load
        </Button>
      </Box>

      <Box sx={{ height: 36, borderLeft: 1, borderColor: "divider" }} />

      {/* Save group */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
        <Box sx={{ display: "flex", gap: 0.75, alignItems: "center" }}>
          <TextField
            value={filename}
            onChange={(e) => onFilenameChange(e.target.value)}
            placeholder="filename.config.json"
            size="small"
            sx={{ minWidth: 220 }}
            error={!!filename && !validation.ok}
            slotProps={{
              htmlInput: { style: { fontFamily: "Roboto Mono, monospace", fontSize: 13 } },
            }}
          />
          <Button
            variant="contained"
            color="success"
            size="small"
            startIcon={<SaveIcon fontSize="small" />}
            onClick={onSave}
            disabled={!canSave}
          >
            Save
          </Button>
          {dirty ? (
            <Chip label="unsaved" color="warning" size="small" />
          ) : sinceSaved != null ? (
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.5,
                fontSize: 11.5,
                color: "success.main",
                fontFamily: "Roboto",
              }}
            >
              <CheckCircleIcon sx={{ fontSize: 14 }} />
              saved {sinceSaved < 60 ? `${sinceSaved}s` : `${Math.round(sinceSaved / 60)}m`} ago
            </Box>
          ) : null}
        </Box>
        {filename && !validation.ok && (
          <Typography variant="caption" sx={{ color: "error.main", pl: 0.5 }}>
            {validation.msg}
          </Typography>
        )}
      </Box>

      <Box sx={{ flex: 1 }} />

      {/* Destructive */}
      <Button
        variant="text"
        color="error"
        size="small"
        startIcon={<DeleteIcon fontSize="small" />}
        onClick={() => onDelete(selectedFile || filename)}
        disabled={!selectedFile && !filename}
      >
        Delete
      </Button>
    </Box>
  );
}
