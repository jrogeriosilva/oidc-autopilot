import { useEffect, useMemo, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useDashboard } from "../hooks/useDashboard";
import LaunchForm from "../components/dashboard/LaunchForm";
import ModuleCardsGrid from "../components/dashboard/ModuleCardsGrid";
import LogDrawer from "../components/dashboard/LogDrawer";
import RunSummary from "../components/dashboard/RunSummary";
import FilterTabs, {
  type FilterId,
  applyFilter,
  deriveFilterCounts,
} from "../components/dashboard/FilterTabs";
import { stopExecution } from "../api/client";

export default function DashboardPage() {
  const dashboard = useDashboard();
  const [filter, setFilter] = useState<FilterId>("all");
  const [planExpanded, setPlanExpanded] = useState(true);
  const [stopping, setStopping] = useState(false);
  const launchTriggerRef = useRef<HTMLButtonElement>(null);

  // Auto-collapse plan config when a run starts, re-expand when idle.
  const prevStatus = useRef(dashboard.status);
  useEffect(() => {
    if (prevStatus.current !== dashboard.status) {
      if (dashboard.status === "running") setPlanExpanded(false);
      else if (dashboard.status === "idle") setPlanExpanded(true);
      prevStatus.current = dashboard.status;
    }
  }, [dashboard.status]);

  const counts = useMemo(() => deriveFilterCounts(dashboard.cards), [dashboard.cards]);
  const visibleCards = useMemo(
    () => applyFilter(dashboard.cards, filter),
    [dashboard.cards, filter],
  );

  const showRunChrome = dashboard.status !== "idle";

  const handleStop = async () => {
    setStopping(true);
    try {
      await stopExecution();
    } catch {
      // surfaced via SSE / state
    } finally {
      setStopping(false);
    }
  };

  const handleRerun = () => {
    setPlanExpanded(true);
    // Scroll launch form into view via click on submit button isn't possible here;
    // expansion alone surfaces the Launch Plan CTA.
  };

  return (
    <>
      <LaunchForm
        isRunning={dashboard.status === "running"}
        onLaunched={() => dashboard.setRunning()}
        onError={() => dashboard.setError()}
        expanded={planExpanded}
        onExpandedChange={setPlanExpanded}
      />

      {showRunChrome && (
        <RunSummary
          status={dashboard.status}
          cards={dashboard.cards}
          outcome={dashboard.outcome}
          elapsedMs={dashboard.elapsedMs}
          onStop={handleStop}
          onRerun={handleRerun}
          stopping={stopping}
        />
      )}

      {showRunChrome && dashboard.cards.length > 0 && (
        <FilterTabs active={filter} onChange={setFilter} counts={counts} />
      )}

      <Box component="section" sx={{ flex: 1, overflow: "auto", p: 2, px: 3 }}>
        <ModuleCardsGrid cards={visibleCards} />
        {visibleCards.length === 0 && dashboard.cards.length > 0 && (
          <Box sx={{ textAlign: "center", py: 4, color: "text.disabled" }}>
            <Typography variant="body2">
              No modules in this state.{" "}
              <Box
                component="button"
                onClick={() => setFilter("all")}
                sx={{
                  background: "none",
                  border: "none",
                  color: "primary.main",
                  cursor: "pointer",
                  fontSize: "inherit",
                  p: 0,
                }}
              >
                Show all
              </Box>
            </Typography>
          </Box>
        )}
      </Box>

      <LogDrawer logs={dashboard.logs} onClear={dashboard.clearLogs} />
      <button ref={launchTriggerRef} style={{ display: "none" }} />
    </>
  );
}
