import type { NormalizedRun, ReportPayload } from "./data";
import type { SpecVersion } from "../config/spec";

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
  customCoverage?: string;
  customSpecVersion?: SpecVersion;
  clipboardError?: string;
}
