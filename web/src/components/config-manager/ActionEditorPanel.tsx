import { useState, useEffect } from "react";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import type { ActionConfig, ApiActionConfig, BrowserActionConfig } from "../../types/api";

interface Props {
  action: ActionConfig;
  onChange: (action: ActionConfig) => void;
  onDone: () => void;
}

export default function ActionEditorPanel({ action, onChange, onDone }: Props) {
  const [payloadText, setPayloadText] = useState("");
  const [headersText, setHeadersText] = useState("");
  const [payloadError, setPayloadError] = useState("");
  const [headersError, setHeadersError] = useState("");

  useEffect(() => {
    if (action.type === "api") {
      setPayloadText(action.payload ? JSON.stringify(action.payload, null, 2) : "");
      setHeadersText(action.headers ? JSON.stringify(action.headers, null, 2) : "");
    }
  }, [action]);

  const handleTypeChange = (newType: string) => {
    if (newType === "api") {
      onChange({
        name: action.name,
        type: "api",
        endpoint: "",
        method: "POST",
      });
    } else {
      onChange({
        name: action.name,
        type: "browser",
        operation: "navigate",
        url: "",
        wait_for: "networkidle",
      });
    }
  };

  const handlePayloadBlur = () => {
    const v = payloadText.trim();
    if (!v) {
      setPayloadError("");
      onChange({ ...(action as ApiActionConfig), payload: undefined });
      return;
    }
    try {
      const parsed = JSON.parse(v);
      setPayloadError("");
      onChange({ ...(action as ApiActionConfig), payload: parsed });
    } catch {
      setPayloadError("Invalid JSON");
    }
  };

  const handleHeadersBlur = () => {
    const v = headersText.trim();
    if (!v) {
      setHeadersError("");
      onChange({ ...(action as ApiActionConfig), headers: undefined });
      return;
    }
    try {
      const parsed = JSON.parse(v);
      setHeadersError("");
      onChange({ ...(action as ApiActionConfig), headers: parsed });
    } catch {
      setHeadersError("Invalid JSON");
    }
  };

  return (
    <Paper variant="outlined" sx={{ p: 1.5, mt: 1 }}>
      <Stack spacing={1}>
        <TextField
          label="Name"
          value={action.name}
          onChange={(e) => onChange({ ...action, name: e.target.value.trim() })}
          size="small"
          fullWidth
        />
        <TextField
          select
          label="Type"
          value={action.type}
          onChange={(e) => handleTypeChange(e.target.value)}
          size="small"
          fullWidth
        >
          <MenuItem value="api">api</MenuItem>
          <MenuItem value="browser">browser</MenuItem>
        </TextField>

        {action.type === "api" ? (
          <>
            <TextField
              label="Endpoint"
              value={(action as ApiActionConfig).endpoint}
              onChange={(e) =>
                onChange({ ...(action as ApiActionConfig), endpoint: e.target.value })
              }
              size="small"
              fullWidth
            />
            <TextField
              select
              label="Method"
              value={(action as ApiActionConfig).method || "POST"}
              onChange={(e) =>
                onChange({ ...(action as ApiActionConfig), method: e.target.value })
              }
              size="small"
              fullWidth
            >
              <MenuItem value="GET">GET</MenuItem>
              <MenuItem value="POST">POST</MenuItem>
              <MenuItem value="PUT">PUT</MenuItem>
              <MenuItem value="DELETE">DELETE</MenuItem>
            </TextField>
            <Box>
              <TextField
                label="Payload"
                value={payloadText}
                onChange={(e) => setPayloadText(e.target.value)}
                onBlur={handlePayloadBlur}
                placeholder='{"key": "value"} (JSON)'
                multiline
                minRows={2}
                size="small"
                fullWidth
                slotProps={{ input: { sx: { fontFamily: "monospace" } } }}
              />
              {payloadError && (
                <Typography variant="caption" color="error">
                  {payloadError}
                </Typography>
              )}
            </Box>
            <Box>
              <TextField
                label="Headers"
                value={headersText}
                onChange={(e) => setHeadersText(e.target.value)}
                onBlur={handleHeadersBlur}
                placeholder='{"Header": "value"} (JSON)'
                multiline
                minRows={2}
                size="small"
                fullWidth
                slotProps={{ input: { sx: { fontFamily: "monospace" } } }}
              />
              {headersError && (
                <Typography variant="caption" color="error">
                  {headersError}
                </Typography>
              )}
            </Box>
          </>
        ) : (
          <>
            <TextField
              label="URL"
              value={(action as BrowserActionConfig).url}
              onChange={(e) =>
                onChange({ ...(action as BrowserActionConfig), url: e.target.value })
              }
              size="small"
              fullWidth
            />
            <TextField
              select
              label="Wait For"
              value={(action as BrowserActionConfig).wait_for || "networkidle"}
              onChange={(e) =>
                onChange({
                  ...(action as BrowserActionConfig),
                  wait_for: e.target.value as "networkidle" | "domcontentloaded" | "load",
                })
              }
              size="small"
              fullWidth
            >
              <MenuItem value="networkidle">networkidle</MenuItem>
              <MenuItem value="domcontentloaded">domcontentloaded</MenuItem>
              <MenuItem value="load">load</MenuItem>
            </TextField>
          </>
        )}

        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Button variant="outlined" size="small" onClick={onDone}>
            Done
          </Button>
        </Box>
      </Stack>
    </Paper>
  );
}
