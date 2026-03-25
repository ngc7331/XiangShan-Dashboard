import { reactive } from "vue";

export interface DashboardSettings {
  selectedBranch: string;
  startDateStr: string;
  endDateStr: string;
  quickRangeDays: number | null;
  selectedBenchmarks: string[];
  selectedTabId: string;
}

const settingsKey = "xs-dashboard-settings-v2";

export function useDashboardSettings() {
  const state = reactive<DashboardSettings>({
    selectedBranch: "",
    startDateStr: "",
    endDateStr: "",
    quickRangeDays: null,
    selectedBenchmarks: [],
    selectedTabId: "ipc-commit",
  });

  function load() {
    try {
      const saved = localStorage.getItem(settingsKey);
      if (!saved) return;
      const data = JSON.parse(saved) as Partial<DashboardSettings>;
      state.selectedBranch = data.selectedBranch || "";
      state.startDateStr = data.startDateStr || "";
      state.endDateStr = data.endDateStr || "";
      state.quickRangeDays =
        typeof data.quickRangeDays === "number" ? data.quickRangeDays : null;
      state.selectedBenchmarks = Array.isArray(data.selectedBenchmarks)
        ? data.selectedBenchmarks
        : [];
      state.selectedTabId = data.selectedTabId || "ipc-commit";
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
