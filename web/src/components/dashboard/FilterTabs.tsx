import Box from "@mui/material/Box";
import type { ModuleCard } from "../../types/api";

export type FilterId = "all" | "running" | "waiting" | "passed" | "failed" | "pending";

interface Props {
  active: FilterId;
  onChange: (id: FilterId) => void;
  counts: Record<FilterId, number>;
}

function hexToRgba(hex: string, alpha: number): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

const TABS: { id: FilterId; label: string; color: string | null }[] = [
  { id: "all", label: "All", color: null },
  { id: "running", label: "Running", color: "#90caf9" },
  { id: "waiting", label: "Waiting", color: "#ffa726" },
  { id: "passed", label: "Passed", color: "#66bb6a" },
  { id: "failed", label: "Failed", color: "#f44336" },
  { id: "pending", label: "Pending", color: null },
];

export function deriveFilterCounts(cards: ModuleCard[]): Record<FilterId, number> {
  const counts: Record<FilterId, number> = {
    all: cards.length,
    running: 0,
    waiting: 0,
    passed: 0,
    failed: 0,
    pending: 0,
  };
  for (const c of cards) {
    if (c.status === "RUNNING") counts.running++;
    else if (c.status === "WAITING") counts.waiting++;
    else if (c.result === "PASSED") counts.passed++;
    else if (c.result === "FAILED" || c.status === "INTERRUPTED") counts.failed++;
    else if (c.status === "PENDING" || c.status === "CONFIGURED") counts.pending++;
  }
  return counts;
}

export function applyFilter(cards: ModuleCard[], id: FilterId): ModuleCard[] {
  if (id === "all") return cards;
  return cards.filter((c) => {
    if (id === "running") return c.status === "RUNNING";
    if (id === "waiting") return c.status === "WAITING";
    if (id === "passed") return c.result === "PASSED";
    if (id === "failed") return c.result === "FAILED" || c.status === "INTERRUPTED";
    if (id === "pending") return c.status === "PENDING" || c.status === "CONFIGURED";
    return true;
  });
}

export default function FilterTabs({ active, onChange, counts }: Props) {
  return (
    <Box
      sx={{
        display: "flex",
        gap: 0.5,
        px: 3,
        pt: 1,
        flexShrink: 0,
      }}
    >
      {TABS.map((t) => {
        const isActive = active === t.id;
        const count = counts[t.id];
        const disabled = count === 0 && t.id !== "all";
        const accent = t.color || "#90caf9";
        return (
          <Box
            key={t.id}
            component="button"
            disabled={disabled}
            onClick={() => onChange(t.id)}
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.75,
              px: 1.5,
              py: 0.5,
              borderRadius: 4,
              border: 1,
              borderColor: isActive ? accent : "rgba(255,255,255,0.12)",
              bgcolor: isActive ? hexToRgba(accent, 0.15) : "transparent",
              color: disabled
                ? "text.disabled"
                : isActive
                  ? t.color || "text.primary"
                  : "text.primary",
              fontSize: 12.5,
              fontFamily: "Roboto, sans-serif",
              fontWeight: 500,
              cursor: disabled ? "not-allowed" : "pointer",
              transition: "all 150ms",
              "&:hover": disabled
                ? {}
                : { bgcolor: isActive ? hexToRgba(accent, 0.2) : "action.hover" },
            }}
          >
            {t.color && (
              <Box
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  bgcolor: t.color,
                  opacity: disabled ? 0.4 : 1,
                }}
              />
            )}
            {t.label}
            <Box component="span" sx={{ opacity: 0.6 }}>
              {count}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
