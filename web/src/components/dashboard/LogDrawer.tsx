import { useState, useRef, useEffect } from "react";
import { ChevronUp, Copy, Trash2, Maximize2, X } from "lucide-react";
import type { LogLine } from "../../types/api";

const sevColors: Record<string, string> = {
  info: "text-accent",
  error: "text-red",
  debug: "text-text-dim",
  log: "text-text-primary",
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

  const wrapperCls = fullscreen
    ? "fixed inset-0 z-[1000] flex flex-col bg-bg-secondary"
    : "shrink-0 bg-bg-secondary border-t border-border flex flex-col";

  return (
    <div className={wrapperCls}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2 cursor-pointer select-none"
        onClick={() => !fullscreen && setCollapsed(!collapsed)}
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-text-primary">
          <ChevronUp
            size={13}
            className={`transition-transform ${collapsed ? "rotate-180" : ""}`}
          />
          Logs
          <span className="text-[0.7rem] bg-border text-text-secondary px-2 py-px rounded-lg font-medium">
            {logs.length}
          </span>
        </span>
        <div className="flex gap-1.5 items-center" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={handleCopy}
            className="text-[0.72rem] px-2 py-0.5 border border-border rounded text-text-secondary hover:text-text-primary hover:border-text-secondary"
          >
            {copied ? "Copied!" : <><Copy size={11} className="inline mr-1" />Copy All</>}
          </button>
          <button
            onClick={onClear}
            className="text-[0.72rem] px-2 py-0.5 border border-border rounded text-text-secondary hover:text-text-primary hover:border-text-secondary"
          >
            <Trash2 size={11} className="inline mr-1" />Clear
          </button>
          <button
            onClick={toggleFullscreen}
            className="text-[0.72rem] px-2 py-0.5 border border-border rounded text-text-secondary hover:text-text-primary hover:border-text-secondary"
          >
            {fullscreen ? <X size={13} /> : <Maximize2 size={13} />}
          </button>
        </div>
      </div>

      {/* Body */}
      <div
        className={`overflow-hidden transition-[max-height] duration-300 ${collapsed ? "max-h-0" : fullscreen ? "flex-1" : "max-h-[220px]"}`}
      >
        <div
          className={`overflow-y-auto font-mono text-[0.78rem] leading-relaxed px-3 py-1.5 bg-bg-input border-t border-[#21262d] ${fullscreen ? "h-[calc(100vh-40px)]" : "h-[220px]"}`}
        >
          {logs.map((line, i) => (
            <div
              key={i}
              className={`whitespace-pre-wrap break-all ${sevColors[line.severity] || "text-text-primary"}`}
            >
              {line.message}
            </div>
          ))}
          <div ref={logEndRef} />
        </div>
      </div>
    </div>
  );
}
