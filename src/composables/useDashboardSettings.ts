import { reactive } from "vue";

export type QuickRangePreset =
  | "lastWeek"
  | "lastMonth"
  | "last3Months"
  | "lastTenRuns";

export interface DashboardSettings {
  selectedBranch: string;
  startDateStr: string;
  endDateStr: string;
  quickRangePreset: QuickRangePreset | null;
  selectedBenchmarks: string[];
  selectedTabId: string;
  selectedSubset: string;
}

const settingsKey = "xs-dashboard-settings-v2";

export function useDashboardSettings() {
  const state = reactive<DashboardSettings>({
    selectedBranch: "",
    startDateStr: "",
    endDateStr: "",
    quickRangePreset: null,
    selectedBenchmarks: [],
    selectedTabId: "ipc-commit",
    selectedSubset: "",
  });

  function load() {
    try {
      const saved = localStorage.getItem(settingsKey);
      if (!saved) return;
      const data = JSON.parse(saved) as Partial<DashboardSettings>;
      state.selectedBranch = data.selectedBranch || "";
      state.startDateStr = data.startDateStr || "";
      state.endDateStr = data.endDateStr || "";
      state.quickRangePreset = data.quickRangePreset || "lastWeek";
      state.selectedBenchmarks = Array.isArray(data.selectedBenchmarks)
        ? data.selectedBenchmarks
        : [];
      state.selectedTabId = data.selectedTabId || "ipc-commit";
      state.selectedSubset = data.selectedSubset || "";
    } catch (err) {
      console.warn("Failed to load settings", err);
    }
  }

  function save() {
    localStorage.setItem(settingsKey, JSON.stringify(state));
  }

  return {
    state,
    load,
    save,
  };
}
