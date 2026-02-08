import { useState, useEffect, type FormEvent } from "react";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Button from "@mui/material/Button";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import TokenInput from "./TokenInput";
import { fetchConfigs, fetchEnvDefaults, launchPlan, stopExecution } from "../../api/client";
import type { LaunchPayload } from "../../types/api";

interface Props {
  isRunning: boolean;
  onLaunched: () => void;
  onError: (msg: string) => void;
}

export default function LaunchForm({ isRunning, onLaunched, onError }: Props) {
  const [configFiles, setConfigFiles] = useState<string[]>([]);
  const [configPath, setConfigPath] = useState("");
  const [planId, setPlanId] = useState("");
  const [serverUrl, setServerUrl] = useState("https://www.certification.openid.net");
  const [token, setToken] = useState("");
  const [pollInterval, setPollInterval] = useState(5);
  const [timeout, setTimeout_] = useState(240);
  const [headless, setHeadless] = useState(true);
  const [stopping, setStopping] = useState(false);

  useEffect(() => {
    fetchConfigs()
      .then((d) => setConfigFiles(d.files))
      .catch(() => {});
    fetchEnvDefaults()
      .then((d) => {
        if (d.planId) setPlanId(d.planId);
        if (d.token) setToken(d.token);
        if (d.serverUrl) setServerUrl(d.serverUrl);
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const payload: LaunchPayload = {
      configPath,
      planId,
      token,
      serverUrl,
      pollInterval,
      timeout,
      headless,
    };
    try {
      await launchPlan(payload);
      onLaunched();
    } catch (err) {
      onError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleStop = async () => {
    setStopping(true);
    try {
      await stopExecution();
    } catch (err) {
      onError(err instanceof Error ? err.message : String(err));
    } finally {
      setStopping(false);
    }
  };

  return (
    <Accordion defaultExpanded disableGutters square sx={{ borderBottom: 1, borderColor: "divider" }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="subtitle2">Plan Configuration</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <form onSubmit={handleSubmit} autoComplete="off">
          <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", mb: 1.5 }}>
            <TextField
              select
              label="Config File"
              value={configPath}
              onChange={(e) => setConfigPath(e.target.value)}
              required
              size="small"
              sx={{ flex: 1, minWidth: 180 }}
            >
              <MenuItem value="">
                <em>-- select a .config.json file --</em>
              </MenuItem>
              {configFiles.map((f) => (
                <MenuItem key={f} value={f}>
                  {f}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Plan ID"
              value={planId}
              onChange={(e) => setPlanId(e.target.value)}
              placeholder="plan-abc-123"
              required
              size="small"
              sx={{ flex: 1, minWidth: 180 }}
            />
            <TextField
              label="Server URL"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              size="small"
              sx={{ flex: 1, minWidth: 180 }}
            />
            <TokenInput value={token} onChange={setToken} />
          </Box>
          <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "center" }}>
            <TextField
              label="Poll Interval (s)"
              type="number"
              value={pollInterval}
              onChange={(e) => setPollInterval(parseInt(e.target.value, 10) || 5)}
              slotProps={{ htmlInput: { min: 1 } }}
              size="small"
              sx={{ width: 130 }}
            />
            <TextField
              label="Timeout (s)"
              type="number"
              value={timeout}
              onChange={(e) => setTimeout_(parseInt(e.target.value, 10) || 240)}
              slotProps={{ htmlInput: { min: 1 } }}
              size="small"
              sx={{ width: 130 }}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={headless}
                  onChange={(e) => setHeadless(e.target.checked)}
                  size="small"
                />
              }
              label="Headless browser"
              slotProps={{ typography: { variant: "body2" } }}
            />
            <Box sx={{ display: "flex", gap: 1, ml: "auto" }}>
              <Button
                type="submit"
                variant="contained"
                color="success"
                disabled={isRunning}
              >
                Launch Plan
              </Button>
              <Button
                type="button"
                variant="contained"
                color="error"
                onClick={handleStop}
                disabled={!isRunning || stopping}
              >
                Stop
              </Button>
            </Box>
          </Box>
        </form>
      </AccordionDetails>
    </Accordion>
  );
}
