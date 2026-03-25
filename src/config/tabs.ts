import type { MetricKey } from "../types/data";

export type AxisMode = "run-id" | "date";

export interface DashboardTabConfig {
  id: "ipc-commit";
  titleKey: string;
  datasetRoot: string;
  metricKey: MetricKey;
  axisMode: AxisMode;
  supportsSpecButtons: boolean;
}

export const DASHBOARD_TABS: DashboardTabConfig[] = [
  {
    id: "ipc-commit",
    titleKey: "tabsIpc",
    datasetRoot: "data/test",
    metricKey: "ipc",
    axisMode: "run-id",
    supportsSpecButtons: true,
  },
];
