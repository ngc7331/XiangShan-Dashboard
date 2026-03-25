export type MetricKey = "ipc" | "score";

export interface RunIndexEntry {
  hash: string;
  title: string;
  date: number;
}

export interface RunIndex {
  data: Record<string, RunIndexEntry>;
}

export type ReportEntry = Partial<Record<MetricKey, number>>;
export type ReportPayload = Record<string, ReportEntry>;

export interface NormalizedRun {
  runId: string;
  hash: string;
  title: string;
  dateMs: number;
}

export function isMetricKey(key: string): key is MetricKey {
  return key === "ipc" || key === "score";
}

export function assertBranchList(value: unknown): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new Error("branch.json must be a string array");
  }
  return value;
}

export function assertRunIndex(value: unknown): RunIndex {
  if (!value || typeof value !== "object") {
    throw new Error("data.json must be an object");
  }
  const obj = value as Record<string, unknown>;
  if (!obj.data || typeof obj.data !== "object") {
    throw new Error("data.json must include { data: { ... } }");
  }

  const entries = obj.data as Record<string, unknown>;
  for (const [runId, raw] of Object.entries(entries)) {
    if (!/^\d+$/.test(runId)) {
      throw new Error(`run_id must be numeric string, got: ${runId}`);
    }
    if (!raw || typeof raw !== "object") {
      throw new Error(`run ${runId} must be an object`);
    }
    const entry = raw as Record<string, unknown>;
    if (
      typeof entry.hash !== "string" ||
      typeof entry.title !== "string" ||
      typeof entry.date !== "number"
    ) {
      throw new Error(
        `run ${runId} must include string hash/title and number date`,
      );
    }
  }

  return value as RunIndex;
}

export function assertReportPayload(value: unknown): ReportPayload {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(
      "report json must be an object mapping benchmark to metric object",
    );
  }

  const payload = value as Record<string, unknown>;
  for (const [benchmark, rawMetric] of Object.entries(payload)) {
    if (!benchmark) {
      throw new Error("benchmark key cannot be empty");
    }
    if (
      !rawMetric ||
      typeof rawMetric !== "object" ||
      Array.isArray(rawMetric)
    ) {
      throw new Error(`benchmark ${benchmark} must map to a metric object`);
    }

    const metricObj = rawMetric as Record<string, unknown>;
    const keys = Object.keys(metricObj);
    if (!keys.length) {
      throw new Error(
        `benchmark ${benchmark} must contain at least one metric`,
      );
    }

    for (const key of keys) {
      if (!isMetricKey(key)) {
        throw new Error(`unsupported metric key ${key}, expected ipc|score`);
      }
      const val = metricObj[key];
      if (typeof val !== "number" || Number.isNaN(val)) {
        throw new Error(
          `metric ${key} for ${benchmark} must be a float number`,
        );
      }
    }
  }

  return payload as ReportPayload;
}
