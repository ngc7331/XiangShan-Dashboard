import type { MetricKey } from "../types/data";

export type AxisMode = "run-id" | "date";
export type ComparisonSourceType = "nightly" | "weekly-gcc15" | "weekly-xscc";

interface TabConfigBase {
  id: string;
  titleKey: string;
}

export interface ChartConfig extends TabConfigBase {
  kind: "chart";
  id:
    | "ipc-commit"
    | "score-nightly"
    | "score-weekly-gcc15"
    | "score-weekly-xscc";
  datasetRoot: string;
  subset?: string;
  metricKey: MetricKey;
  axisMode: AxisMode;
  supportsSpecButtons: boolean;
}

export interface ComparisonConfig extends TabConfigBase {
  kind: "comparison";
  id: "performance-compare";
}

export type TabConfig = ChartConfig | ComparisonConfig;

export const DASHBOARD_TABS: TabConfig[] = [
  {
    kind: "chart",
    id: "ipc-commit",
    titleKey: "tabsTest",
    datasetRoot: "data/test",
    metricKey: "ipc",
    axisMode: "run-id",
    supportsSpecButtons: true,
  },
  {
    kind: "chart",
    id: "score-nightly",
    titleKey: "tabsNightly",
    datasetRoot: "data/nightly",
    metricKey: "score",
    axisMode: "date",
    supportsSpecButtons: true,
  },
  {
    kind: "chart",
    id: "score-weekly-gcc15",
    titleKey: "tabsWeekly",
    datasetRoot: "data/weekly",
    subset: "gcc15",
    metricKey: "score",
    axisMode: "date",
    supportsSpecButtons: true,
  },
  {
    kind: "chart",
    id: "score-weekly-xscc",
    titleKey: "tabsWeekly",
    datasetRoot: "data/weekly",
    subset: "xscc",
    metricKey: "score",
    axisMode: "date",
    supportsSpecButtons: true,
  },
  {
    kind: "comparison",
    id: "performance-compare",
    titleKey: "tabsCompare",
  },
];
