import { reactive } from "vue";

export type QuickRangePreset = "last7days" | "last31days" | "latest10";

export interface DashboardSettings {
  selectedBranch: string;
  startDateStr: string;
  endDateStr: string;
  quickRangePreset: QuickRangePreset | null;
  selectedBenchmarks: string[];
  selectedTabId: string;
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
  });

  function load() {
    try {
      const saved = localStorage.getItem(settingsKey);
      if (!saved) return;
      const data = JSON.parse(saved) as Partial<DashboardSettings>;
      state.selectedBranch = data.selectedBranch || "";
      state.startDateStr = data.startDateStr || "";
      state.endDateStr = data.endDateStr || "";
      if (
        data.quickRangePreset === "last7days" ||
        data.quickRangePreset === "last31days" ||
        data.quickRangePreset === "latest10"
      ) {
        state.quickRangePreset = data.quickRangePreset;
      } else {
        const legacyData = data as Partial<{ quickRangeDays: number }>;
        if (legacyData.quickRangeDays === 7) {
          state.quickRangePreset = "last7days";
        } else if (legacyData.quickRangeDays === 31) {
          state.quickRangePreset = "last31days";
        } else {
          state.quickRangePreset = null;
        }
      }
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
