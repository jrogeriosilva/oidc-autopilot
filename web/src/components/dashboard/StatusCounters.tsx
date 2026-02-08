import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import type { ExecutionSummary } from "../../types/api";

interface Props {
  outcome: ExecutionSummary | null;
}

export default function StatusCounters({ outcome }: Props) {
  if (!outcome) return null;

  const other = outcome.skipped + outcome.interrupted;

  return (
    <Stack direction="row" spacing={1} sx={{ ml: "auto", alignItems: "center" }}>
      <Chip label={`${outcome.passed}/${outcome.total}`} size="small" />
      <Chip label={`Passed: ${outcome.passed}`} size="small" color="success" />
      <Chip label={`Failed: ${outcome.failed}`} size="small" color="error" />
      {outcome.warning > 0 && (
        <Chip label={`Warn: ${outcome.warning}`} size="small" color="warning" />
      )}
      {other > 0 && (
        <Chip label={`Other: ${other}`} size="small" />
      )}
    </Stack>
  );
}
