<template>
  <div class="comparison-layout">
    <section class="comparison-table-shell">
      <div class="comparison-header">
        <div>
          <h2>
            {{ t("comparisonTitle") }}
            <span class="comparison-sources"
              >{{ sourceAName }} <strong>vs</strong> {{ sourceBName }}</span
            >
          </h2>
        </div>
      </div>
      <div
        v-if="!rowsByClass.int.length && !rowsByClass.fp.length"
        class="empty"
      >
        {{ t("comparisonNoData") }}
      </div>
      <div v-else class="comparison-tables">
        <div
          v-for="group in [
            { key: 'int', title: t('comparisonSpecInt') },
            { key: 'fp', title: t('comparisonSpecFp') },
          ]"
          :key="group.key"
          class="table-group"
        >
          <h3>{{ group.title }}</h3>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{{ t("comparisonBenchmark") }}</th>
                  <th>{{ t("comparisonSourceA") }}</th>
                  <th>{{ t("comparisonSourceB") }}</th>
                  <th>{{ t("comparisonDiff") }}</th>
                  <th>{{ t("comparisonDiffPct") }}</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in rowsByClass[group.key as 'int' | 'fp']"
                  :key="row.name"
                  :class="{ 'geomean-row': row.name.startsWith('GEOMEAN') }"
                >
                  <td>{{ row.name }}</td>
                  <td>{{ format(row.a) }}</td>
                  <td>{{ format(row.b) }}</td>
                  <td :class="diffClass(row.diff)">{{ format(row.diff) }}</td>
                  <td :class="diffClass(row.diffPct)">
                    {{ formatPct(row.diffPct) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { isPrefixed } from "../../composables/useBenchmarkSelection";
import { formatDisplayDate } from "../../services/dataService";
import type { ReportPayload } from "../../types/data";
import type { ComparisonSource } from "../../types/comparison";

interface ComparisonRow {
  name: string;
  a: number | null;
  b: number | null;
  diff: number | null;
  diffPct: number | null;
}

const props = defineProps<{
  t: (key: string) => string;
  sources: ComparisonSource[];
}>();
const sources = computed(() => props.sources);
const sourceAName = computed(() => sourceName(sources.value[0]));
const sourceBName = computed(() => sourceName(sources.value[1]));

const rowsByClass = computed(() => ({
  int: buildRows("SPEC06INT"),
  fp: buildRows("SPEC06FP"),
}));

function buildRows(prefix: "SPEC06INT" | "SPEC06FP"): ComparisonRow[] {
  const a = sources.value[0]?.payload || {};
  const b = sources.value[1]?.payload || {};
  const names = Array.from(new Set([...Object.keys(a), ...Object.keys(b)]))
    .filter((name) => !name.startsWith("GEOMEAN") && isPrefixed(name, prefix))
    .sort();
  const rows = names.map((name) =>
    makeRow(name, metric(a[name]), metric(b[name])),
  );
  const aGeo = geometricMean(rows.map((row) => row.a));
  const bGeo = geometricMean(rows.map((row) => row.b));
  return [makeRow(`GEOMEAN-${prefix}`, aGeo, bGeo), ...rows];
}

function makeRow(
  name: string,
  av: number | null,
  bv: number | null,
): ComparisonRow {
  const diff = av !== null && bv !== null ? bv - av : null;
  return {
    name,
    a: av,
    b: bv,
    diff,
    diffPct: diff !== null && av ? (diff / av) * 100 : null,
  };
}
function geometricMean(values: Array<number | null>): number | null {
  const valid = values.filter(
    (value): value is number => value !== null && value > 0,
  );
  return valid.length
    ? Math.exp(
        valid.reduce((sum, value) => sum + Math.log(value), 0) / valid.length,
      )
    : null;
}
function metric(entry: ReportPayload[string] | undefined): number | null {
  if (!entry) return null;
  const value = entry.score ?? entry.ipc;
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
function sourceName(source?: ComparisonSource) {
  if (!source) return "";
  if (source.runId === "custom") {
    return source.customCommit && source.customDate
      ? `${props.t("comparisonClipboard")} · ${source.customCommit} · ${source.customDate}`
      : props.t("comparisonClipboard");
  }
  const run = source.runs.find((item) => item.runId === source.runId);
  return run
    ? `${source.branch} · ${run.runId} · ${run.hash.slice(0, 8)} · ${formatDisplayDate(run.dateMs)}`
    : source.label;
}
function format(value: number | null) {
  return value === null ? "—" : value.toFixed(4);
}
function formatPct(value: number | null) {
  return value === null ? "—" : `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}
function diffClass(value: number | null) {
  return value === null ? "" : value >= 0 ? "positive" : "negative";
}
</script>

<style scoped>
.comparison-layout {
  display: flex;
  min-height: 0;
  flex: 1;
  height: 100%;
}
.comparison-table-shell {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: var(--shadow);
  padding: 18px;
  min-height: 0;
  width: 100%;
}
.comparison-table-shell {
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.comparison-tables {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  min-height: 0;
  flex: 1;
  height: 0;
}
.table-group {
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.table-group h3 {
  margin: 0 0 8px;
  font-size: 14px;
  color: var(--muted);
}
.comparison-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}
h2 {
  margin: 4px 0 0;
  font-size: 22px;
}
h2 span {
  color: var(--muted);
  font-weight: 500;
}
.comparison-sources {
  margin-left: 8px;
  font-size: 16px;
}
.comparison-sources strong {
  color: var(--text);
  font-weight: 700;
  margin: 0 8px;
}
.comparison-count {
  color: var(--muted);
  font-size: 13px;
}
.table-wrap {
  overflow: auto;
  flex: 1;
  min-height: 0;
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  font-weight: 600;
}
th,
td {
  padding: 6px 10px;
  border-bottom: 1px solid #edf0f5;
  text-align: right;
  white-space: nowrap;
}
th:first-child,
td:first-child {
  text-align: left;
}
th {
  color: var(--muted);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  position: sticky;
  top: 0;
  background: #fff;
}
td:first-child {
  font-weight: 700;
}
.geomean-row td {
  font-weight: 800;
}
.positive {
  color: #14804a;
}
.negative {
  color: #c0392b;
}
.empty {
  flex: 1;
  display: grid;
  place-items: center;
  color: var(--muted);
  font-weight: 700;
  min-height: 280px;
}
@media (max-width: 960px) {
  .comparison-tables {
    grid-template-columns: 1fr;
  }
}
</style>
