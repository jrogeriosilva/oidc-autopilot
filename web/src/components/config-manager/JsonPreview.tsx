import { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import DataObjectIcon from "@mui/icons-material/DataObject";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import type { PlanConfig } from "../../types/api";

function buildExportConfig(config: PlanConfig): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (config.capture_vars && config.capture_vars.length) out.capture_vars = config.capture_vars;
  if (config.variables && Object.keys(config.variables).length) out.variables = config.variables;
  if (config.actions && config.actions.length) {
    out.actions = config.actions.map((a) => {
      if (a.type === "api") {
        const o: Record<string, unknown> = { name: a.name, type: "api" };
        if (a.endpoint) o.endpoint = a.endpoint;
        if (a.method) o.method = a.method;
        if (a.payload) o.payload = a.payload;
        if (a.headers) o.headers = a.headers;
        return o;
      }
      const o: Record<string, unknown> = { name: a.name, type: "browser" };
      if (a.operation) o.operation = a.operation;
      if (a.url) o.url = a.url;
      if (a.wait_for) o.wait_for = a.wait_for;
      return o;
    });
  }
  if (config.modules && config.modules.length) {
    out.modules = config.modules.map((m) => ({
      name: m.name,
      ...(m.actions && m.actions.length ? { actions: m.actions } : {}),
      ...(m.variables && Object.keys(m.variables).length ? { variables: m.variables } : {}),
    }));
  }
  return out;
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function highlightJson(text: string): string {
  return escapeHtml(text)
    .replace(/"((?:\\.|[^"\\])*)"(\s*:)?/g, (_, str, colon) => {
      const color = colon ? "#90caf9" : "#ffa726";
      return `<span style="color:${color}">"${str}"</span>${colon || ""}`;
    })
    .replace(/\b(-?\d+(?:\.\d+)?)\b/g, '<span style="color:#ce93d8">$1</span>')
    .replace(/\b(true|false|null)\b/g, '<span style="color:#66bb6a">$1</span>');
}

interface Props {
  config: PlanConfig;
  filename: string;
}

export default function JsonPreview({ config, filename }: Props) {
  const [copied, setCopied] = useState(false);
  const exported = useMemo(() => buildExportConfig(config), [config]);
  const json = useMemo(() => JSON.stringify(exported, null, 2), [exported]);
  const bytes = useMemo(() => new Blob([json]).size, [json]);
  const lines = useMemo(() => json.split("\n").length, [json]);
  const html = useMemo(() => highlightJson(json), [json]);

  const copy = () => {
    try {
      navigator.clipboard.writeText(json);
    } catch {
      // ignore
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 1 }}>
        <DataObjectIcon sx={{ fontSize: 16, color: "text.secondary" }} />
        <Typography variant="subtitle2">Live preview</Typography>
        <Typography
          variant="caption"
          sx={{ fontFamily: "Roboto Mono, monospace", color: "text.disabled" }}
        >
          {filename || "(unsaved)"} · {lines} lines · {bytes}B
        </Typography>
        <Box sx={{ ml: "auto" }}>
          <Button
            size="small"
            startIcon={<ContentCopyIcon fontSize="small" />}
            onClick={copy}
          >
            {copied ? "Copied!" : "Copy"}
          </Button>
        </Box>
      </Box>
      <Box
        component="pre"
        sx={{
          flex: 1,
          m: 0,
          p: 1.5,
          bgcolor: "background.default",
          border: 1,
          borderColor: "divider",
          borderRadius: 1,
          fontFamily: "Roboto Mono, monospace",
          fontSize: 12,
          lineHeight: 1.55,
          color: "rgba(255,255,255,0.85)",
          overflow: "auto",
          whiteSpace: "pre",
          minHeight: 0,
        }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </Box>
  );
}
