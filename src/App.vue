<template>
  <div id="app-root">
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-mark" />
        <div>
          <h1>XiangShan Dashboard</h1>
          <div class="muted link-row">
            <a
              class="gh-link"
              href="https://github.com/ngc7331/XiangShan-Dashboard"
              target="_blank"
              rel="noreferrer"
            >
              <span class="gh-icon" aria-hidden="true">
                <svg viewBox="0 0 16 16" role="img" focusable="false">
                  <path
                    d="M8 0a8 8 0 0 0-2.53 15.6c.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2 .37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.28.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.19 0 .21.15.46.55.38A8 8 0 0 0 8 0Z"
                  />
                </svg>
              </span>
              <span>Dashboard</span>
            </a>
            <span>·</span>
            <a
              class="gh-link"
              href="https://github.com/OpenXiangShan/XiangShan"
              target="_blank"
              rel="noreferrer"
            >
              <span class="gh-icon" aria-hidden="true">
                <svg viewBox="0 0 16 16" role="img" focusable="false">
                  <path
                    d="M8 0a8 8 0 0 0-2.53 15.6c.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2 .37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.28.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.19 0 .21.15.46.55.38A8 8 0 0 0 8 0Z"
                  />
                </svg>
              </span>
              <span>XiangShan</span>
            </a>
          </div>
        </div>
      </div>

      <FilterPanel
        :t="t"
        :branches="branches"
        :selected-branch="selectedBranch"
        :start-date-str="startDateStr"
        :end-date-str="endDateStr"
        :active-quick-days="quickRangeDays"
        @branch-change="onBranchChange"
        @start-date-change="onStartDateChange"
        @end-date-change="onEndDateChange"
        @set-last-days="setLastDays"
      />

      <BenchmarkSelector
        :t="t"
        :benchmarks="availableBenchmarks"
        :selected="selectedBenchmarks"
        :show-spec-buttons="activeTab.supportsSpecButtons"
        @select-default="onSelectDefault"
        @select-all="onSelectAll"
        @clear-selection="onClearSelection"
        @select-spec="onSelectSpec"
        @toggle-benchmark="onToggleBenchmark"
      />
    </aside>

    <main class="content">
      <DashboardHero
        :tabs="tabs"
        :selected-tab-id="selectedTabId"
        :tab-title="t"
        :runs-label="t('runsLabel')"
        :benchmarks-label="t('testcasesLabel')"
        :run-count="filteredRuns.length"
        :benchmark-count="selectedBenchmarks.length"
        @tab-change="onTabChange"
      />

      <MetricChartPanel
        :tab="activeTab"
        :runs="filteredRuns"
        :selected-benchmarks="selectedBenchmarks"
        :run-data-by-hash="runDataByHash"
        :no-data-text="chartEmptyText"
        :geomean-missing="geomeanMissing"
        :t="t"
      />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import DashboardHero from "./components/DashboardHero.vue";
import FilterPanel from "./components/sidebar/FilterPanel.vue";
import BenchmarkSelector from "./components/sidebar/BenchmarkSelector.vue";
import MetricChartPanel from "./components/charts/MetricChartPanel.vue";
import { DASHBOARD_TABS } from "./config/tabs";
import { useLocale } from "./composables/useLocale";
import { useDashboardSettings } from "./composables/useDashboardSettings";
import {
  selectDefault,
  selectPrefix,
  toggleSelection,
  isPrefixed,
} from "./composables/useBenchmarkSelection";
import {
  formatInputDate,
  getDateRange,
  loadBranchList,
  loadReport,
  loadRunIndex,
} from "./services/dataService";
import type { NormalizedRun, ReportPayload } from "./types/data";

const dayMs = 24 * 60 * 60 * 1000;
const defaultQuickRangeDays = 7;
const tabs = DASHBOARD_TABS;

const { t } = useLocale();
const {
  state: settings,
  load: loadSettings,
  save: saveSettings,
} = useDashboardSettings();

const selectedTabId = ref(settings.selectedTabId || tabs[0].id);
const activeTab = computed(
  () => tabs.find((tab) => tab.id === selectedTabId.value) || tabs[0],
);

const branches = ref<string[]>([]);
const selectedBranch = ref(settings.selectedBranch || "");
const startDateStr = ref(settings.startDateStr || "");
const endDateStr = ref(settings.endDateStr || "");
const quickRangeDays = ref<number | null>(settings.quickRangeDays ?? null);

const allRuns = ref<NormalizedRun[]>([]);
const filteredRuns = ref<NormalizedRun[]>([]);
const runDataByHash = ref<Record<string, ReportPayload>>({});

const availableBenchmarks = ref<string[]>([]);
const selectedBenchmarks = ref<string[]>([]);
const errorText = ref("");
const isHydrating = ref(true);
const isLoading = ref(false);
const loadingPath = ref("");

const geomeanMissing = ref<Record<number, Record<string, string[]>>>({});

const chartEmptyText = computed(() => {
  if (isLoading.value) {
    return loadingPath.value
      ? `${t("loading")}: ${loadingPath.value}`
      : t("loading");
  }
  return errorText.value || t("noData");
});

function setLoading(path = "") {
  isLoading.value = true;
  loadingPath.value = path;
}

function finishLoading() {
  isLoading.value = false;
  loadingPath.value = "";
}

function persist() {
  settings.selectedTabId = selectedTabId.value;
  settings.selectedBranch = selectedBranch.value;
  settings.startDateStr = startDateStr.value;
  settings.endDateStr = endDateStr.value;
  settings.quickRangeDays = quickRangeDays.value;
  settings.selectedBenchmarks = selectedBenchmarks.value;
  saveSettings();
}

function syncSelection() {
  const selectedSet = new Set(selectedBenchmarks.value);
  const valid = availableBenchmarks.value.filter((tc) => selectedSet.has(tc));
  if (valid.length) {
    selectedBenchmarks.value = valid;
  } else {
    selectedBenchmarks.value = selectDefault(availableBenchmarks.value);
  }
}

async function refreshRuns() {
  if (!startDateStr.value || !endDateStr.value) return;
  setLoading();
  try {
    const { startMs, endMs } = getDateRange(
      startDateStr.value,
      endDateStr.value,
    );
    filteredRuns.value = allRuns.value.filter(
      (run) => run.dateMs >= startMs && run.dateMs <= endMs,
    );

    const needed = filteredRuns.value.filter(
      (run) => !runDataByHash.value[run.hash],
    );
    for (const run of needed) {
      setLoading(
        `${activeTab.value.datasetRoot}/${selectedBranch.value}/${run.hash}.json`,
      );
      runDataByHash.value[run.hash] = await loadReport(
        activeTab.value,
        selectedBranch.value,
        run.hash,
      );
    }

    const set = new Set<string>();
    for (const run of filteredRuns.value) {
      const payload = runDataByHash.value[run.hash];
      if (!payload) continue;
      Object.keys(payload).forEach((name) => set.add(name));
    }

    set.add("GEOMEAN");
    set.add("GEOMEAN-SPEC06INT");
    set.add("GEOMEAN-SPEC06FP");

    availableBenchmarks.value = Array.from(set).sort();

    // Calculate geomeanMissing after availableBenchmarks is set
    const geomean: Record<number, Record<string, string[]>> = {};
    filteredRuns.value.forEach((run, runIdx) => {
      const payload = runDataByHash.value[run.hash];
      ["GEOMEAN", "GEOMEAN-SPEC06INT", "GEOMEAN-SPEC06FP"].forEach((name) => {
        let scopeTestcases = availableBenchmarks.value.filter(
          (n) => !n.startsWith("GEOMEAN"),
        );
        if (name === "GEOMEAN-SPEC06INT") {
          scopeTestcases = scopeTestcases.filter((n) =>
            isPrefixed(n, "SPEC06INT"),
          );
        } else if (name === "GEOMEAN-SPEC06FP") {
          scopeTestcases = scopeTestcases.filter((n) =>
            isPrefixed(n, "SPEC06FP"),
          );
        }
        const missing = scopeTestcases.filter((tc) => {
          if (!payload) return true;
          if (!Object.prototype.hasOwnProperty.call(payload, tc)) return true;
          const entry = payload?.[tc];
          const metricValue = entry?.[activeTab.value.metricKey];
          if (typeof metricValue !== "number" || metricValue <= 0) return true;
          return false;
        });
        if (missing.length) {
          if (!geomean[runIdx]) geomean[runIdx] = {};
          geomean[runIdx][name] = missing;
        }
      });
    });
    geomeanMissing.value = geomean;

    syncSelection();
    persist();
  } finally {
    finishLoading();
  }
}

async function loadCurrentTabData() {
  errorText.value = "";
  runDataByHash.value = {};

  try {
    setLoading(`${activeTab.value.datasetRoot}/branch.json`);
    branches.value = await loadBranchList(activeTab.value);
    if (!branches.value.includes(selectedBranch.value)) {
      selectedBranch.value = branches.value[0] || "";
    }

    setLoading(
      `${activeTab.value.datasetRoot}/${selectedBranch.value}/data.json`,
    );
    allRuns.value = await loadRunIndex(activeTab.value, selectedBranch.value);
    if (quickRangeDays.value) {
      setLastDays(quickRangeDays.value, false);
    } else if (!startDateStr.value || !endDateStr.value) {
      setLastDays(defaultQuickRangeDays, false);
    }

    await refreshRuns();
  } catch (err) {
    console.error(err);
    errorText.value = err instanceof Error ? err.message : String(err);
    filteredRuns.value = [];
    availableBenchmarks.value = [];
    selectedBenchmarks.value = [];
  } finally {
    finishLoading();
  }
}

function onSelectDefault() {
  selectedBenchmarks.value = selectDefault(availableBenchmarks.value);
  persist();
}

function onSelectAll() {
  selectedBenchmarks.value = [...availableBenchmarks.value];
  persist();
}

function onClearSelection() {
  selectedBenchmarks.value = [];
  persist();
}

function onSelectSpec(prefix: "SPEC06INT" | "SPEC06FP") {
  selectedBenchmarks.value = selectPrefix(availableBenchmarks.value, prefix);
  persist();
}

function onToggleBenchmark(name: string) {
  selectedBenchmarks.value = toggleSelection(
    availableBenchmarks.value,
    selectedBenchmarks.value,
    name,
  );
  persist();
}

function onTabChange(nextTabId: string) {
  selectedTabId.value = nextTabId;
}

function onBranchChange(nextBranch: string) {
  selectedBranch.value = nextBranch;
}

function onStartDateChange(value: string) {
  startDateStr.value = value;
  quickRangeDays.value = null;
  persist();
}

function onEndDateChange(value: string) {
  endDateStr.value = value;
  quickRangeDays.value = null;
  persist();
}

function setLastDays(days: number, shouldPersist = true) {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date(end.getTime() - (days - 1) * dayMs);
  startDateStr.value = formatInputDate(start);
  endDateStr.value = formatInputDate(end);
  quickRangeDays.value = days;
  if (shouldPersist) {
    persist();
  }
}

watch(selectedTabId, async () => {
  if (isHydrating.value) return;
  startDateStr.value = "";
  endDateStr.value = "";
  selectedBenchmarks.value = [];
  await loadCurrentTabData();
});

watch([selectedBranch, startDateStr, endDateStr], async () => {
  if (isHydrating.value) return;
  if (!selectedBranch.value || !startDateStr.value || !endDateStr.value) return;

  if (!allRuns.value.length || !allRuns.value.some((run) => run.hash)) {
    return;
  }

  await refreshRuns();
});

watch(selectedBranch, async () => {
  if (isHydrating.value) return;
  if (!selectedBranch.value) return;
  allRuns.value = await loadRunIndex(activeTab.value, selectedBranch.value);
  if (quickRangeDays.value) {
    setLastDays(quickRangeDays.value, false);
  } else {
    setLastDays(defaultQuickRangeDays, false);
  }
  runDataByHash.value = {};
  await refreshRuns();
});

onMounted(async () => {
  isHydrating.value = true;
  try {
    loadSettings();
    selectedTabId.value = settings.selectedTabId || tabs[0].id;
    selectedBranch.value = settings.selectedBranch || "";
    startDateStr.value = settings.startDateStr || "";
    endDateStr.value = settings.endDateStr || "";
    quickRangeDays.value = settings.quickRangeDays ?? null;
    selectedBenchmarks.value = settings.selectedBenchmarks || [];
    await loadCurrentTabData();
  } finally {
    isHydrating.value = false;
  }
});
</script>
