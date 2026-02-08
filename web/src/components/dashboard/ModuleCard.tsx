import type { ModuleCard as ModuleCardType } from "../../types/api";

const statusBorderMap: Record<string, string> = {
  RUNNING: "border-accent-hover",
  WAITING: "border-accent-hover",
};

const resultBorderMap: Record<string, string> = {
  PASSED: "border-green-solid",
  FAILED: "border-red",
  WARNING: "border-yellow",
};

const statusBadgeMap: Record<string, string> = {
  PENDING: "bg-border text-text-secondary",
  CREATED: "bg-border text-text-secondary",
  CONFIGURED: "bg-border text-text-secondary",
  RUNNING: "bg-blue-bg text-accent animate-pulse-opacity",
  WAITING: "bg-yellow-bg text-yellow animate-pulse-opacity",
  FINISHED: "bg-green-bg text-green",
  INTERRUPTED: "bg-red-bg text-red",
  ERROR: "bg-red-bg text-red",
};

const resultBadgeMap: Record<string, string> = {
  PASSED: "text-green bg-green-bg",
  FAILED: "text-red bg-red-bg",
  WARNING: "text-yellow bg-yellow-bg",
  SKIPPED: "text-text-secondary",
  REVIEW: "text-text-secondary",
  UNKNOWN: "text-text-secondary",
};

interface Props {
  card: ModuleCardType;
}

export default function ModuleCard({ card }: Props) {
  const isFinished = card.status === "FINISHED";
  const borderClass = isFinished
    ? resultBorderMap[card.result] || "border-border"
    : card.status === "INTERRUPTED"
      ? "border-red"
      : statusBorderMap[card.status] || "border-border";

  return (
    <div
      className={`bg-bg-secondary border ${borderClass} rounded-lg p-3.5 flex flex-col gap-1.5 transition-colors`}
    >
      <div className="flex items-center gap-1.5 flex-wrap">
        <span
          className="text-sm font-semibold text-text-heading break-words leading-tight flex-1"
          title={card.name}
        >
          {card.name}
        </span>
        <span
          className={`text-[0.65rem] px-2 py-0.5 rounded-xl font-semibold uppercase whitespace-nowrap ${statusBadgeMap[card.status] || "bg-border text-text-secondary"}`}
        >
          {card.status}
        </span>
        {card.result && (
          <span
            className={`text-[0.6rem] px-1.5 py-px rounded font-semibold ${resultBadgeMap[card.result] || "text-text-secondary"}`}
          >
            {card.result}
          </span>
        )}
      </div>
      <div className="text-[0.72rem] text-text-dim overflow-hidden text-ellipsis whitespace-nowrap min-h-[1em]">
        {card.lastMessage}
      </div>
    </div>
  );
}
