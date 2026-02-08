import { useState, useEffect } from "react";
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

  const inputCls =
    "flex-1 px-2 py-1 bg-bg-input border border-border rounded text-text-primary text-[0.8rem] focus:outline-none focus:border-accent";
  const labelCls = "text-[0.78rem] text-text-secondary min-w-[70px]";

  return (
    <div className="bg-bg-secondary border border-border rounded-lg p-3 mt-2">
      {/* Name */}
      <div className="flex gap-2 mb-1.5 items-center">
        <label className={labelCls}>Name</label>
        <input
          type="text"
          value={action.name}
          onChange={(e) => onChange({ ...action, name: e.target.value.trim() })}
          className={inputCls}
        />
      </div>

      {/* Type */}
      <div className="flex gap-2 mb-1.5 items-center">
        <label className={labelCls}>Type</label>
        <select
          value={action.type}
          onChange={(e) => handleTypeChange(e.target.value)}
          className={inputCls}
        >
          <option value="api">api</option>
          <option value="browser">browser</option>
        </select>
      </div>

      {action.type === "api" ? (
        <>
          <div className="flex gap-2 mb-1.5 items-center">
            <label className={labelCls}>Endpoint</label>
            <input
              type="text"
              value={(action as ApiActionConfig).endpoint}
              onChange={(e) =>
                onChange({ ...(action as ApiActionConfig), endpoint: e.target.value })
              }
              className={inputCls}
            />
          </div>
          <div className="flex gap-2 mb-1.5 items-center">
            <label className={labelCls}>Method</label>
            <select
              value={(action as ApiActionConfig).method || "POST"}
              onChange={(e) =>
                onChange({ ...(action as ApiActionConfig), method: e.target.value })
              }
              className={inputCls}
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>
          <div className="flex gap-2 mb-1.5 items-start">
            <label className={`${labelCls} pt-1`}>Payload</label>
            <div className="flex-1">
              <textarea
                value={payloadText}
                onChange={(e) => setPayloadText(e.target.value)}
                onBlur={handlePayloadBlur}
                placeholder='{"key": "value"} (JSON)'
                className="w-full min-h-[60px] px-2 py-1 bg-bg-input border border-border rounded text-text-primary text-[0.8rem] font-mono focus:outline-none focus:border-accent resize-y"
              />
              {payloadError && (
                <span className="text-red text-[0.7rem]">{payloadError}</span>
              )}
            </div>
          </div>
          <div className="flex gap-2 mb-1.5 items-start">
            <label className={`${labelCls} pt-1`}>Headers</label>
            <div className="flex-1">
              <textarea
                value={headersText}
                onChange={(e) => setHeadersText(e.target.value)}
                onBlur={handleHeadersBlur}
                placeholder='{"Header": "value"} (JSON)'
                className="w-full min-h-[60px] px-2 py-1 bg-bg-input border border-border rounded text-text-primary text-[0.8rem] font-mono focus:outline-none focus:border-accent resize-y"
              />
              {headersError && (
                <span className="text-red text-[0.7rem]">{headersError}</span>
              )}
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="flex gap-2 mb-1.5 items-center">
            <label className={labelCls}>URL</label>
            <input
              type="text"
              value={(action as BrowserActionConfig).url}
              onChange={(e) =>
                onChange({ ...(action as BrowserActionConfig), url: e.target.value })
              }
              className={inputCls}
            />
          </div>
          <div className="flex gap-2 mb-1.5 items-center">
            <label className={labelCls}>Wait For</label>
            <select
              value={(action as BrowserActionConfig).wait_for || "networkidle"}
              onChange={(e) =>
                onChange({
                  ...(action as BrowserActionConfig),
                  wait_for: e.target.value as "networkidle" | "domcontentloaded" | "load",
                })
              }
              className={inputCls}
            >
              <option value="networkidle">networkidle</option>
              <option value="domcontentloaded">domcontentloaded</option>
              <option value="load">load</option>
            </select>
          </div>
        </>
      )}

      <div className="flex justify-end mt-1.5">
        <button
          type="button"
          onClick={onDone}
          className="px-3.5 py-1 bg-[#21262d] border border-border rounded-md text-text-primary font-semibold text-[0.82rem] cursor-pointer hover:bg-border"
        >
          Done
        </button>
      </div>
    </div>
  );
}
