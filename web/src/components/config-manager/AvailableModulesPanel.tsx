import { useState } from "react";
import type { ModuleConfig } from "../../types/api";

interface Props {
  availableModules: string[];
  configModules: ModuleConfig[];
  onToggle: (name: string, checked: boolean) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onFetch: (planName: string) => void;
}

export default function AvailableModulesPanel({
  availableModules,
  configModules,
  onToggle,
  onSelectAll,
  onDeselectAll,
  onFetch,
}: Props) {
  const [planName, setPlanName] = useState("");
  const [filter, setFilter] = useState("");

  const configNames = configModules.map((m) => m.name);

  // Merge available + config modules
  const allNames = [...new Set([...availableModules, ...configNames])].sort();
  const filtered = filter
    ? allNames.filter((n) => n.toLowerCase().includes(filter.toLowerCase()))
    : allNames;

  return (
    <>
      <div className="flex gap-1.5 mb-1.5">
        <input
          type="text"
          value={planName}
          onChange={(e) => setPlanName(e.target.value)}
          placeholder="e.g. fapi1-advanced-final-test-plan"
          className="flex-1 min-w-0 px-2 py-1 bg-bg-input border border-border rounded text-text-primary text-[0.82rem] focus:outline-none focus:border-accent"
        />
        <button
          type="button"
          onClick={() => onFetch(planName.trim())}
          className="px-3.5 py-1 bg-[#21262d] border border-border rounded-md text-text-primary font-semibold text-[0.82rem] cursor-pointer hover:bg-border whitespace-nowrap"
        >
          Fetch
        </button>
      </div>
      <input
        type="text"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Filter modules..."
        className="w-full mb-1.5 px-2 py-1 bg-bg-input border border-border rounded text-text-primary text-[0.82rem] focus:outline-none focus:border-accent"
      />
      <div className="flex gap-1 mb-1.5">
        <button
          type="button"
          onClick={onSelectAll}
          className="bg-transparent border border-border rounded text-text-secondary text-[0.72rem] px-2 py-0.5 cursor-pointer hover:text-text-primary hover:border-text-secondary"
        >
          Select All
        </button>
        <button
          type="button"
          onClick={onDeselectAll}
          className="bg-transparent border border-border rounded text-text-secondary text-[0.72rem] px-2 py-0.5 cursor-pointer hover:text-text-primary hover:border-text-secondary"
        >
          Deselect All
        </button>
      </div>
      <div className="max-h-[300px] overflow-y-auto border border-[#21262d] rounded bg-bg-input">
        {filtered.length === 0 && (
          <div className="p-2 text-[0.78rem] text-text-secondary">
            No modules found. Enter a plan name and click Fetch.
          </div>
        )}
        {filtered.map((name) => (
          <label
            key={name}
            className={`flex items-center gap-2 px-2.5 py-1.5 border-b border-[#21262d] last:border-b-0 text-[0.8rem] cursor-pointer hover:bg-bg-secondary transition-colors ${configNames.includes(name) ? "bg-blue-bg/20" : ""}`}
          >
            <input
              type="checkbox"
              checked={configNames.includes(name)}
              onChange={(e) => onToggle(name, e.target.checked)}
              className="m-0 cursor-pointer"
            />
            <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
              {name}
            </span>
          </label>
        ))}
      </div>
    </>
  );
}
