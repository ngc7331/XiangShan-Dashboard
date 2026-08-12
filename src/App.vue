<template>
  <div id="app-root">
    <header class="topbar">
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
      <DashboardHero
        :tabs="tabs"
        :selected-tab-id="selectedTabId"
        :tab-title="displayTabTitle"
        :runs-label="t('runsLabel')"
        :benchmarks-label="t('testcasesLabel')"
        :run-count="filteredRuns.length"
        :benchmark-count="
          activeTab.kind === 'comparison'
            ? comparisonBenchmarkCount
            : selectedBenchmarks.length
        "
        :show-badges="activeTab.kind === 'chart'"
        :show-benchmark-badge="activeTab.kind === 'comparison'"
        @tab-change="onTabChange"
      />
    </header>

    <main class="content">
      <div v-if="activeTab.kind === 'chart'" class="tab-workspace">
        <aside class="panel-sidebar">
          <RangeSelector
            :t="t"
            :branches="branches"
            :selected-branch="selectedBranch"
            :start-date-str="startDateStr"
            :end-date-str="endDateStr"
            :active-quick-preset="quickRangePreset"
            @branch-change="onBranchChange"
            @start-date-change="onStartDateChange"
            @end-date-change="onEndDateChange"
            @set-quick-preset="setQuickPreset"
          />
          <BenchmarkSelector
            :t="t"
            :benchmarks="availableBenchmarks"
            :selected="selectedBenchmarks"
            :show-spec-buttons="activeChartTab.supportsSpecButtons"
            @select-default="onSelectDefault"
            @select-all="onSelectAll"
            @clear-selection="onClearSelection"
            @select-spec="onSelectSpec"
            @select-geomean="onSelectGeomean"
            @toggle-benchmark="onToggleBenchmark"
          />
        </aside>
        <MetricChartPanel
          :tab="activeChartTab"
          :runs="filteredRuns"
          :selected-benchmarks="selectedBenchmarks"
          :run-data-by-hash="runDataByHash"
          :no-data-text="chartEmptyText"
          :geomean-missing="geomeanMissing"
          :t="t"
        />
      </div>
      <div v-else class="comparison-workspace">
        <aside class="panel-sidebar comparison-sidebar">
          <ComparisonTypeSelector
            :t="t"
            :comparison-type="comparisonType"
            @change="onComparisonTypeChange"
          />
          <ComparisonSourceSelector
            v-for="source in comparisonSources"
            :key="source.id"
            :t="t"
            :source="source"
            :on-paste="pasteComparisonSource"
            @branch-change="onComparisonBranchChange(source.id, $event)"
            @run-change="onComparisonRunChange(source.id, $event)"
          />
        </aside>
        <ComparisonPanel :t="t" :sources="comparisonSources" />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import DashboardHero from "./components/DashboardHero.vue";
import RangeSelector from "./components/sidebars/RangeSelector.vue";
import BenchmarkSelector from "./components/sidebars/BenchmarkSelector.vue";
import ComparisonTypeSelector from "./components/sidebars/ComparisonTypeSelector.vue";
import ComparisonSourceSelector from "./components/sidebars/ComparisonSourceSelector.vue";
import MetricChartPanel from "./components/panels/MetricChartPanel.vue";
import ComparisonPanel from "./components/panels/ComparisonPanel.vue";
import {
  DASHBOARD_TABS,
  type ChartConfig,
  type ComparisonSourceType,
} from "./config/tabs";
import { useLocale } from "./composables/useLocale";
import { useDashboardSettings } from "./composables/useDashboardSettings";
import type { QuickRangePreset } from "./composables/useDashboardSettings";
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
import type { ComparisonSource } from "./types/comparison";
const dayMs = 24 * 60 * 60 * 1000;
const defaultQuickRangePreset: QuickRangePreset = "last7days";
const tabs = DASHBOARD_TABS;
const comparisonTabs: Record<ComparisonSourceType, ChartConfig> = {
  nightly: tabs[1] as ChartConfig,
  "weekly-gcc15": tabs[2] as ChartConfig,
  "weekly-xscc": tabs[3] as ChartConfig,
};

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
const defaultChartTab = DASHBOARD_TABS.find(
  (tab): tab is ChartConfig => tab.kind === "chart",
)!;
const activeChartTab = computed(() =>
  activeTab.value.kind === "chart" ? activeTab.value : defaultChartTab,
);

function displayTabTitle(tab: (typeof tabs)[number]) {
  return tab.kind === "chart" && tab.subset
    ? t(tab.titleKey).replace("{0}", tab.subset)
    : t(tab.titleKey);
}

const branches = ref<string[]>([]);
const selectedBranch = ref(settings.selectedBranch || "");
const startDateStr = ref(settings.startDateStr || "");
const endDateStr = ref(settings.endDateStr || "");
const quickRangePreset = ref<QuickRangePreset | null>(
  settings.quickRangePreset ?? null,
);

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

const comparisonSources = ref<ComparisonSource[]>([
  {
    id: "a",
    label: t("comparisonSourceA"),
    branch: "",
    branches: [],
    runs: [],
    runId: "",
  },
  {
    id: "b",
    label: t("comparisonSourceB"),
    branch: "",
    branches: [],
    runs: [],
    runId: "",
  },
]);
const comparisonType = ref<ComparisonSourceType>("nightly");

const comparisonBenchmarkCount = computed(() => {
  const payloads = comparisonSources.value
    .map((source) => source.payload || {})
    .filter((payload) => Object.keys(payload).length > 0);
  if (!payloads.length) return 0;
  const names = new Set(payloads.flatMap((payload) => Object.keys(payload)));
  const countGroup = (prefix: "SPEC06INT" | "SPEC06FP") =>
    Array.from(names).filter(
      (name) => !name.startsWith("GEOMEAN") && isPrefixed(name, prefix),
    ).length;
  return countGroup("SPEC06INT") + countGroup("SPEC06FP") + 2;
});

function comparisonSourceConfig() {
  return comparisonTabs[comparisonType.value];
}

async function loadComparisonSource(source: ComparisonSource) {
  const tab = comparisonSourceConfig();
  source.branches = await loadBranchList(tab);
  if (!source.branches.includes(source.branch))
    source.branch = source.branches[0] || "";
  if (!source.branch) return;
  source.runs = await loadRunIndex(tab, source.branch);
  if (!source.runs.some((run) => run.runId === source.runId))
    source.runId = source.runs[source.runs.length - 1]?.runId || "";
  const run = source.runs.find((item) => item.runId === source.runId);
  source.payload = run
    ? await loadReport(tab, source.branch, run.hash)
    : undefined;
}

async function loadComparisonSources() {
  setLoading();
  try {
    await Promise.all(
      comparisonSources.value
        .filter((source) => source.runId !== "custom")
        .map(loadComparisonSource),
    );
  } catch (err) {
    errorText.value = err instanceof Error ? err.message : String(err);
  } finally {
    finishLoading();
  }
}

async function onComparisonTypeChange(type: ComparisonSourceType) {
  comparisonType.value = type;
  comparisonSources.value.forEach((source) => {
    if (source.runId === "custom") return;
    source.label = t(
      source.id === "a" ? "comparisonSourceA" : "comparisonSourceB",
    );
    source.customCommit = undefined;
    source.customDate = undefined;
    source.branch = "";
    source.runId = "";
    source.payload = undefined;
  });
  await loadComparisonSources();
}

async function onComparisonBranchChange(id: "a" | "b", branch: string) {
  const source = comparisonSources.value.find((item) => item.id === id);
  if (!source) return;
  source.label = t(
    source.id === "a" ? "comparisonSourceA" : "comparisonSourceB",
  );
  source.customCommit = undefined;
  source.customDate = undefined;
  source.branch = branch;
  source.runId = "";
  source.payload = undefined;
  await loadComparisonSource(source);
}

async function onComparisonRunChange(id: "a" | "b", runId: string) {
  const source = comparisonSources.value.find((item) => item.id === id);
  if (!source) return;
  source.label = t(
    source.id === "a" ? "comparisonSourceA" : "comparisonSourceB",
  );
  source.customCommit = undefined;
  source.customDate = undefined;
  source.runId = runId;
  const run = source.runs.find((item) => item.runId === runId);
  source.payload = run
    ? await loadReport(comparisonSourceConfig(), source.branch, run.hash)
    : undefined;
}

function parseClipboardReport(text: string): ReportPayload {
  const parsed: ReportPayload = {};
  try {
    const json = JSON.parse(text) as unknown;
    if (json && typeof json === "object" && !Array.isArray(json)) {
      for (const [name, raw] of Object.entries(
        json as Record<string, unknown>,
      )) {
        if (typeof raw === "number") parsed[name] = { score: raw };
        else if (raw && typeof raw === "object") {
          const entry = raw as Record<string, unknown>;
          const value =
            typeof entry.score === "number"
              ? entry.score
              : typeof entry.ipc === "number"
                ? entry.ipc
                : null;
          if (value !== null)
            parsed[name] =
              typeof entry.score === "number"
                ? { score: value }
                : { ipc: value };
        }
      }
    }
  } catch {
    /* fall through to score.txt parser */
  }
  if (Object.keys(parsed).length) return parsed;
  for (const line of text.split(/\r?\n/)) {
    const match = /^\s*(\d+\.\w+)\s+[\d.NaN]+\s+[\d.NaN]+\s+([\d.NaN]+)/.exec(
      line,
    );
    if (match && match[2] !== "NaN")
      parsed[match[1]] = { score: Number(match[2]) };
  }
  if (!Object.keys(parsed).length)
    throw new Error(t("comparisonClipboardError"));
  return parsed;
}

function extractClipboardMetadata(text: string): {
  commit?: string;
  date?: string;
} {
  const match = /(?:^|[\\/\s])cr(\d{6})-([0-9a-f]{7,40})-/i.exec(text);
  if (!match) return {};
  const [, compactDate, commit] = match;
  const year = 2000 + Number(compactDate.slice(0, 2));
  const month = Number(compactDate.slice(2, 4));
  const day = Number(compactDate.slice(4, 6));
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  )
    return {};
  return {
    commit,
    date: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
  };
}

async function pasteComparisonSource(id: "a" | "b") {
  if (!navigator.clipboard?.readText)
    throw new Error(t("comparisonClipboardDenied"));
  const text = await navigator.clipboard.readText();
  const payload = parseClipboardReport(text);
  const metadata = extractClipboardMetadata(text);
  const source = comparisonSources.value.find((item) => item.id === id);
  if (source) {
    source.payload = payload;
    source.runId = "custom";
    source.customCommit = metadata.commit;
    source.customDate = metadata.date;
  }
}

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
  settings.quickRangePreset = quickRangePreset.value;
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
  if (
    quickRangePreset.value !== "latest10" &&
    (!startDateStr.value || !endDateStr.value)
  ) {
    return;
  }

  setLoading();
  try {
    if (quickRangePreset.value === "latest10") {
      filteredRuns.value = allRuns.value.slice(-10);
    } else {
      const { startMs, endMs } = getDateRange(
        startDateStr.value,
        endDateStr.value,
      );
      filteredRuns.value = allRuns.value.filter(
        (run) => run.dateMs >= startMs && run.dateMs <= endMs,
      );
    }

    const needed = filteredRuns.value.filter(
      (run) => !runDataByHash.value[run.hash],
    );
    for (const run of needed) {
      setLoading(
        `${activeChartTab.value.datasetRoot}/${selectedBranch.value}/${run.hash}.json`,
      );
      runDataByHash.value[run.hash] = await loadReport(
        activeChartTab.value,
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
          (n) => !n.startsWith("GEOMEAN") && !n.startsWith("legacy"),
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
          const metricValue = entry?.[activeChartTab.value.metricKey];
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
    setLoading(`${activeChartTab.value.datasetRoot}/branch.json`);
    branches.value = await loadBranchList(activeChartTab.value);
    if (!branches.value.includes(selectedBranch.value)) {
      selectedBranch.value = branches.value[0] || "";
    }

    setLoading(
      `${activeChartTab.value.datasetRoot}/${selectedBranch.value}/data.json`,
    );
    allRuns.value = await loadRunIndex(
      activeChartTab.value,
      selectedBranch.value,
    );
    if (quickRangePreset.value === "last7days") {
      setQuickPreset("last7days", false);
    } else if (quickRangePreset.value === "last31days") {
      setQuickPreset("last31days", false);
    } else if (!startDateStr.value || !endDateStr.value) {
      setQuickPreset(defaultQuickRangePreset, false);
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

function onSelectGeomean() {
  selectedBenchmarks.value = availableBenchmarks.value.filter((name) =>
    name.startsWith("GEOMEAN"),
  );
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
  persist();
}

function onBranchChange(nextBranch: string) {
  selectedBranch.value = nextBranch;
}

function onStartDateChange(value: string) {
  startDateStr.value = value;
  quickRangePreset.value = null;
  persist();
}

function onEndDateChange(value: string) {
  endDateStr.value = value;
  quickRangePreset.value = null;
  persist();
}

function setQuickPreset(preset: QuickRangePreset, shouldPersist = true) {
  quickRangePreset.value = preset;
  if (preset === "latest10") {
    if (shouldPersist) {
      persist();
    }
    return;
  }

  const days = preset === "last31days" ? 31 : 7;
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date(end.getTime() - (days - 1) * dayMs);
  startDateStr.value = formatInputDate(start);
  endDateStr.value = formatInputDate(end);
  if (shouldPersist) {
    persist();
  }
}

watch(selectedTabId, async () => {
  if (isHydrating.value) return;
  if (activeTab.value.kind === "comparison") {
    await loadComparisonSources();
    return;
  }
  startDateStr.value = "";
  endDateStr.value = "";
  selectedBenchmarks.value = [];
  await loadCurrentTabData();
});

watch([selectedBranch, startDateStr, endDateStr], async () => {
  if (isHydrating.value) return;
  if (!selectedBranch.value) return;
  if (
    quickRangePreset.value !== "latest10" &&
    (!startDateStr.value || !endDateStr.value)
  ) {
    return;
  }

  if (!allRuns.value.length || !allRuns.value.some((run) => run.hash)) {
    return;
  }

  await refreshRuns();
});

watch(quickRangePreset, async (preset) => {
  if (isHydrating.value) return;
  if (!preset) return;
  if (!selectedBranch.value) return;
  if (!allRuns.value.length || !allRuns.value.some((run) => run.hash)) {
    return;
  }
  await refreshRuns();
});

watch(selectedBranch, async () => {
  if (isHydrating.value) return;
  if (!selectedBranch.value) return;
  allRuns.value = await loadRunIndex(
    activeChartTab.value,
    selectedBranch.value,
  );
  if (quickRangePreset.value === "last7days") {
    setQuickPreset("last7days", false);
  } else if (quickRangePreset.value === "last31days") {
    setQuickPreset("last31days", false);
  } else if (!quickRangePreset.value) {
    setQuickPreset(defaultQuickRangePreset, false);
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
    quickRangePreset.value = settings.quickRangePreset ?? null;
    selectedBenchmarks.value = settings.selectedBenchmarks || [];
    if (activeTab.value.kind === "comparison") {
      await loadComparisonSources();
    } else {
      await loadCurrentTabData();
    }
  } finally {
    isHydrating.value = false;
  }
});
</script>
