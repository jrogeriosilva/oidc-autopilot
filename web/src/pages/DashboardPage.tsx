import { useDashboard } from "../hooks/useDashboard";
import LaunchForm from "../components/dashboard/LaunchForm";
import ModuleCardsGrid from "../components/dashboard/ModuleCardsGrid";
import LogDrawer from "../components/dashboard/LogDrawer";
import StatusCounters from "../components/dashboard/StatusCounters";

const statusBadgeMap: Record<string, { cls: string; label: string }> = {
  idle: { cls: "bg-border text-text-secondary", label: "Idle" },
  running: { cls: "bg-blue-bg text-accent animate-pulse-opacity", label: "Running" },
  done: { cls: "bg-green-bg text-green", label: "Done" },
  errored: { cls: "bg-red-bg text-red", label: "Failed" },
  stopped: { cls: "bg-red-bg text-red", label: "Stopped" },
};

export default function DashboardPage() {
  const dashboard = useDashboard();
  const badge = statusBadgeMap[dashboard.status] || statusBadgeMap.idle;

  return (
    <>
      {/* Status bar in topbar area */}
      <div className="flex items-center gap-4 px-6 py-1 bg-bg-secondary border-b border-border">
        <span
          className={`text-[0.7rem] px-2.5 py-0.5 rounded-xl font-semibold uppercase ${badge.cls}`}
        >
          {badge.label}
        </span>
        <StatusCounters outcome={dashboard.outcome} />
      </div>

      <LaunchForm
        isRunning={dashboard.status === "running"}
        onLaunched={() => dashboard.setRunning()}
        onError={() => dashboard.setError()}
      />

      {/* Module cards */}
      <section className="flex-1 overflow-y-auto p-4 px-6">
        <ModuleCardsGrid cards={dashboard.cards} />
      </section>

      <LogDrawer logs={dashboard.logs} onClear={dashboard.clearLogs} />
    </>
  );
}
