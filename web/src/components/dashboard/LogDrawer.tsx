import { useState, useRef, useEffect } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteIcon from "@mui/icons-material/Delete";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import CloseIcon from "@mui/icons-material/Close";
import type { LogLine } from "../../types/api";

const sevColors: Record<string, string> = {
  info: "info.main",
  error: "error.main",
  debug: "text.disabled",
  log: "text.primary",
};

interface Props {
  logs: LogLine[];
  onClear: () => void;
}

export default function LogDrawer({ logs, onClear }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs.length]);

  const handleCopy = () => {
    const text = logs.map((l) => l.message).join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const toggleFullscreen = () => {
    setFullscreen(!fullscreen);
    if (!fullscreen) setCollapsed(false);
  };

  return (
    <Box
      sx={
        fullscreen
          ? { position: "fixed", inset: 0, zIndex: 1300, display: "flex", flexDirection: "column", bgcolor: "background.paper" }
          : { flexShrink: 0, bgcolor: "background.paper", borderTop: 1, borderColor: "divider", display: "flex", flexDirection: "column" }
      }
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 2,
          py: 1,
          cursor: fullscreen ? "default" : "pointer",
          userSelect: "none",
        }}
        onClick={() => !fullscreen && setCollapsed(!collapsed)}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <KeyboardArrowUpIcon
            fontSize="small"
            sx={{
              transition: "transform 0.2s",
              transform: collapsed ? "rotate(180deg)" : "none",
            }}
          />
          <Typography variant="subtitle2">Logs</Typography>
          <Chip label={logs.length} size="small" />
        </Box>
        <Box
          sx={{ display: "flex", gap: 0.5, alignItems: "center" }}
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            size="small"
            startIcon={<ContentCopyIcon fontSize="small" />}
            onClick={handleCopy}
          >
            {copied ? "Copied!" : "Copy All"}
          </Button>
          <Button
            size="small"
            startIcon={<DeleteIcon fontSize="small" />}
            onClick={onClear}
          >
            Clear
          </Button>
          <IconButton size="small" onClick={toggleFullscreen}>
            {fullscreen ? <CloseIcon fontSize="small" /> : <FullscreenIcon fontSize="small" />}
          </IconButton>
        </Box>
      </Box>

      {/* Body */}
      <Box
        sx={{
          overflow: "hidden",
          transition: "max-height 0.3s",
          ...(collapsed
            ? { maxHeight: 0 }
            : fullscreen
              ? { flex: 1 }
              : { maxHeight: 220 }),
        }}
      >
        <Box
          sx={{
            overflowY: "auto",
            fontFamily: "monospace",
            fontSize: "0.78rem",
            lineHeight: 1.6,
            px: 1.5,
            py: 0.75,
            bgcolor: "background.default",
            borderTop: 1,
            borderColor: "divider",
            height: fullscreen ? "calc(100vh - 48px)" : 220,
          }}
        >
          {logs.map((line, i) => (
            <Box
              key={i}
              component="div"
              sx={{
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
                color: sevColors[line.severity] || "text.primary",
              }}
            >
              {line.message}
            </Box>
          ))}
          <div ref={logEndRef} />
        </Box>
      </Box>
    </Box>
  );
}
