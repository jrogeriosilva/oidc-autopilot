import type { ExecutionSummary } from "../../types/api";

interface Props {
  outcome: ExecutionSummary | null;
}

export default function StatusCounters({ outcome }: Props) {
  if (!outcome) return null;

  const other = outcome.skipped + outcome.interrupted;

  return (
    <div className="flex gap-2 ml-auto items-center">
      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-border text-text-primary">
        {outcome.passed}/{outcome.total}
      </span>
      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-green-bg text-green">
        Passed: {outcome.passed}
      </span>
      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-red-bg text-red">
        Failed: {outcome.failed}
      </span>
      {outcome.warning > 0 && (
        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-yellow-bg text-yellow">
          Warn: {outcome.warning}
        </span>
      )}
      {other > 0 && (
        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-border text-text-primary">
          Other: {other}
        </span>
      )}
    </div>
  );
}
