import type { NormalizedRun, ReportPayload } from "./data";

export type ComparisonSourceId = "a" | "b";

export interface ComparisonSource {
  id: ComparisonSourceId;
  label: string;
  branch: string;
  branches: string[];
  runs: NormalizedRun[];
  runId: string;
  payload?: ReportPayload;
  customCommit?: string;
  customDate?: string;
}
