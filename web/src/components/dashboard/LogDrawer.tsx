import { useState, useRef, useEffect, useMemo } from "react";
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
import SearchIcon from "@mui/icons-material/Search";
import VerticalAlignBottomIcon from "@mui/icons-material/VerticalAlignBottom";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import type { LogLine } from "../../types/api";

const sevColors: Record<string, string> = {
  info: "#29b6f6",
  error: "#f44336",
  debug: "rgba(255,255,255,0.5)",
  log: "#fff",
};

const sevFill: Record<string, string> = {
  info: "rgba(41,182,246,0.15)",
  error: "rgba(244,67,54,0.15)",
  debug: "rgba(255,255,255,0.08)",
  log: "rgba(255,255,255,0.08)",
};

const sevBorder: Record<string, string> = {
  info: "#29b6f6",
  error: "#f44336",
  debug: "rgba(255,255,255,0.4)",
  log: "rgba(255,255,255,0.4)",
};

const SEVERITIES = ["info", "log", "debug", "error"] as const;

interface Props {
  logs: LogLine[];
  onClear: () => void;
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function HighlightMatch({
  text,
  query,
  baseColor,
}: {
  text: string;
  query: string;
  baseColor: string;
}) {
  if (!query) return <span style={{ color: baseColor }}>{text}</span>;
  try {
    const re = new RegExp(`(${escapeRegExp(query)})`, "ig");
    const parts = text.split(re);
    return (
      <span style={{ color: baseColor }}>
        {parts.map((p, i) =>
          p && p.toLowerCase() === query.toLowerCase() ? (
            <mark
              key={i}
              style={{
                background: "rgba(255,167,38,0.4)",
                color: "#fff",
                padding: "0 1px",
                borderRadius: 2,
              }}
            >
              {p}
            </mark>
          ) : (
            <span key={i}>{p}</span>
          ),
        )}
      </span>
    );
  } catch {
    return <span style={{ color: baseColor }}>{text}</span>;
  }
}

export default function LogDrawer({ logs, onClear }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [follow, setFollow] = useState(true);
  const [query, setQuery] = useState("");
  const [activeSev, setActiveSev] = useState<Set<string>>(() => new Set(SEVERITIES));
  const scrollRef = useRef<HTMLDivElement>(null);

  const counts = useMemo(() => {
    const c: Record<string, number> = { info: 0, log: 0, debug: 0, error: 0 };
    for (const l of logs) c[l.severity] = (c[l.severity] || 0) + 1;
    return c;
  }, [logs]);

  const filteredLogs = useMemo(() => {
    const q = query.trim().toLowerCase();
    return logs.filter((l) => {
      if (!activeSev.has(l.severity)) return false;
      if (q && !l.message.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [logs, activeSev, query]);

  useEffect(() => {
    if (!follow) return;
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [filteredLogs.length, follow, collapsed, fullscreen]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
    if (!atBottom && follow) setFollow(false);
  };

  const pinToBottom = () => {
    setFollow(true);
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  };

  const handleCopy = () => {
    const text = filteredLogs.map((l) => l.message).join("\n");
    try {
      navigator.clipboard.writeText(text);
    } catch {
      // ignore
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const toggleSeverity = (s: string) => {
    setActiveSev((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      if (next.size === 0) return new Set(SEVERITIES);
      return next;
    });
  };

  const toggleFullscreen = () => {
    setFullscreen(!fullscreen);
    if (!fullscreen) setCollapsed(false);
  };

  return (
    <Box
      sx={
        fullscreen
          ? {
              position: "fixed",
              inset: 0,
              zIndex: 1300,
              display: "flex",
              flexDirection: "column",
              bgcolor: "background.paper",
            }
          : {
              flexShrink: 0,
              bgcolor: "background.paper",
              borderTop: 1,
              borderColor: "divider",
              display: "flex",
              flexDirection: "column",
            }
      }
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 2,
          py: 0.75,
          gap: 1,
          userSelect: "none",
        }}
      >
        <Box
          onClick={() => !fullscreen && setCollapsed(!collapsed)}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            cursor: fullscreen ? "default" : "pointer",
          }}
        >
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
          {!collapsed && (
            <>
              <Box sx={{ display: "flex", gap: 0.5, mr: 0.5 }}>
                {SEVERITIES.map((s) => {
                  const active = activeSev.has(s);
                  const c = sevColors[s];
                  return (
                    <Box
                      component="button"
                      key={s}
                      onClick={() => toggleSeverity(s)}
                      title={active ? `Hide ${s}` : `Show ${s}`}
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 0.5,
                        bgcolor: active ? sevFill[s] : "transparent",
                        border: 1,
                        borderColor: active ? sevBorder[s] : "rgba(255,255,255,0.23)",
                        color: active ? c : "rgba(255,255,255,0.5)",
                        borderRadius: 4,
                        px: 1.25,
                        py: 0.25,
                        fontSize: 11.5,
                        fontFamily: "Roboto, sans-serif",
                        fontWeight: 500,
                        cursor: "pointer",
                        transition: "all 150ms",
                      }}
                    >
                      <Box
                        sx={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          bgcolor: c,
                          opacity: active ? 1 : 0.4,
                        }}
                      />
                      {s}
                      <Box component="span" sx={{ opacity: 0.7 }}>
                        {counts[s] || 0}
                      </Box>
                    </Box>
                  );
                })}
              </Box>

              <Box sx={{ position: "relative", mr: 0.5 }}>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search logs…"
                  style={{
                    width: 180,
                    padding: "4px 26px 4px 28px",
                    border: "1px solid rgba(255,255,255,0.23)",
                    borderRadius: 4,
                    background: "transparent",
                    color: "#fff",
                    fontFamily: "Roboto, sans-serif",
                    fontSize: 12.5,
                    outline: "none",
                  }}
                />
                <SearchIcon
                  sx={{
                    fontSize: 16,
                    color: "rgba(255,255,255,0.5)",
                    position: "absolute",
                    left: 8,
                    top: "50%",
                    transform: "translateY(-50%)",
                  }}
                />
                {query && (
                  <Box
                    component="span"
                    onClick={() => setQuery("")}
                    sx={{
                      position: "absolute",
                      right: 4,
                      top: "50%",
                      transform: "translateY(-50%)",
                      cursor: "pointer",
                      display: "inline-flex",
                    }}
                  >
                    <CloseIcon sx={{ fontSize: 14, color: "rgba(255,255,255,0.5)" }} />
                  </Box>
                )}
              </Box>

              <Button
                size="small"
                onClick={pinToBottom}
                sx={{ color: follow ? "success.main" : "primary.main" }}
                startIcon={
                  follow ? (
                    <VerticalAlignBottomIcon fontSize="small" />
                  ) : (
                    <PlayArrowIcon fontSize="small" />
                  )
                }
              >
                {follow ? "Following" : "Follow"}
              </Button>
              <Button
                size="small"
                startIcon={<ContentCopyIcon fontSize="small" />}
                onClick={handleCopy}
              >
                {copied ? "Copied!" : "Copy"}
              </Button>
              <Button
                size="small"
                startIcon={<DeleteIcon fontSize="small" />}
                onClick={onClear}
              >
                Clear
              </Button>
            </>
          )}
          <IconButton
            size="small"
            onClick={toggleFullscreen}
            title={fullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {fullscreen ? <CloseIcon fontSize="small" /> : <FullscreenIcon fontSize="small" />}
          </IconButton>
        </Box>
      </Box>

      {/* Body */}
      <Box
        sx={{
          overflow: "hidden",
          transition: "max-height 0.3s",
          position: "relative",
          ...(collapsed
            ? { maxHeight: 0 }
            : fullscreen
              ? { flex: 1 }
              : { maxHeight: 240 }),
        }}
      >
        <Box
          ref={scrollRef}
          onScroll={handleScroll}
          sx={{
            overflowY: "auto",
            fontFamily: "Roboto Mono, monospace",
            fontSize: "0.78rem",
            lineHeight: 1.6,
            px: 2,
            py: 0.75,
            bgcolor: "background.default",
            borderTop: 1,
            borderColor: "divider",
            height: fullscreen ? "calc(100vh - 56px)" : 240,
          }}
        >
          {filteredLogs.length === 0 && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                color: "text.disabled",
                fontFamily: "Roboto, sans-serif",
                fontSize: 12,
              }}
            >
              {logs.length === 0 ? "No logs yet." : "No log lines match the current filter."}
            </Box>
          )}
          {filteredLogs.map((l, i) => (
            <Box
              key={i}
              sx={{
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
              }}
            >
              <HighlightMatch
                text={l.message}
                query={query}
                baseColor={sevColors[l.severity] || "#fff"}
              />
            </Box>
          ))}
        </Box>

        {!follow && !collapsed && filteredLogs.length > 0 && (
          <Box
            component="button"
            onClick={pinToBottom}
            sx={{
              position: "absolute",
              right: 16,
              bottom: 8,
              bgcolor: "primary.main",
              color: "rgba(0,0,0,0.87)",
              border: "none",
              borderRadius: 4,
              px: 1.5,
              py: 0.5,
              fontFamily: "Roboto",
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 0.5,
              boxShadow: 4,
            }}
          >
            <VerticalAlignBottomIcon sx={{ fontSize: 14 }} />
            Follow tail
          </Box>
        )}
      </Box>
    </Box>
  );
}
