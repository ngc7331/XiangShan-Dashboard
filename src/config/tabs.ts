import type { MetricKey } from "../types/data";

export type AxisMode = "run-id" | "date";

export interface DashboardTabConfig {
  id: "ipc-commit" | "score-nightly";
  titleKey: string;
  datasetRoot: string;
  metricKey: MetricKey;
  axisMode: AxisMode;
  supportsSpecButtons: boolean;
}

export const DASHBOARD_TABS: DashboardTabConfig[] = [
  {
    id: "ipc-commit",
    titleKey: "tabsTest",
    datasetRoot: "data/test",
    metricKey: "ipc",
    axisMode: "run-id",
    supportsSpecButtons: true,
  },
  {
    id: "score-nightly",
    titleKey: "tabsNightly",
    datasetRoot: "data/nightly",
    metricKey: "score",
    axisMode: "date",
    supportsSpecButtons: true,
  },
];
