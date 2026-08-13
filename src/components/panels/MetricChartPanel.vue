<template>
  <div ref="exportRoot" class="chart-shell">
    <div class="chart-header">
      <h2 class="chart-title">
        {{ title }}
        <span v-if="summary" class="chart-summary">{{ summary }}</span>
      </h2>
    </div>
    <div class="chart-wrap" v-if="hasData">
      <canvas ref="canvasRef"></canvas>
    </div>
    <div class="empty" v-else>
      {{ noDataText }}
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import type { Chart } from "chart.js";
import { toPng } from "html-to-image";
import type { ChartConfig } from "../../config/tabs";
import type { SpecVersion } from "../../config/spec";
import type { NormalizedRun, ReportPayload } from "../../types/data";
import { renderMetricChart } from "../../composables/useMetricChart";

const props = defineProps<{
  tab: ChartConfig;
  runs: NormalizedRun[];
  selectedBenchmarks: string[];
  runDataByHash: Record<string, ReportPayload>;
  noDataText: string;
  geomeanMissing: Record<number, Record<string, string[]>>;
  specVersion: SpecVersion;
  t: (key: string) => string;
  title: string;
  summary: string;
}>();

const canvasRef = ref<HTMLCanvasElement | null>(null);
const exportRoot = ref<HTMLElement | null>(null);
let chart: Chart | null = null;
let renderGeneration = 0;

const hasData = computed(
  () => props.runs.length > 0 && props.selectedBenchmarks.length > 0,
);

async function redraw() {
  const currentGeneration = ++renderGeneration;

  if (!hasData.value) {
    if (chart) {
      chart.destroy();
      chart = null;
    }
    return;
  }

  await nextTick();
  if (currentGeneration !== renderGeneration) return;
  if (!hasData.value || !canvasRef.value) return;

  chart = renderMetricChart({
    canvas: canvasRef.value,
    chart,
    tab: props.tab,
    runs: props.runs,
    selectedBenchmarks: props.selectedBenchmarks,
    runDataByHash: props.runDataByHash,
    geomeanMissing: props.geomeanMissing,
    specVersion: props.specVersion,
    t: props.t,
  });
}

onMounted(redraw);
watch(
  () => [
    props.tab.id,
    props.runs,
    props.selectedBenchmarks,
    props.runDataByHash,
    props.geomeanMissing,
    props.specVersion,
  ],
  redraw,
  { deep: true },
);

onBeforeUnmount(() => {
  renderGeneration += 1;
  if (chart) chart.destroy();
  chart = null;
});

async function exportPng(): Promise<string> {
  const source = exportRoot.value;
  if (!source || !hasData.value) {
    throw new Error(props.t("exportNoData"));
  }

  const rect = source.getBoundingClientRect();
  const width = Math.ceil(rect.width);
  const height = Math.ceil(rect.height);
  if (!width || !height) throw new Error(props.t("exportError"));
  return await toPng(source, {
    width,
    height,
    pixelRatio: 2,
    cacheBust: true,
  });
}

defineExpose({ exportPng });
</script>

<style scoped>
.chart-shell {
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e1e6ef;
  box-shadow: 0 12px 32px rgba(17, 31, 64, 0.08);
  padding: 12px;
  min-height: 380px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.chart-header {
  flex: 0 0 auto;
  padding: 4px 6px 12px;
}

.chart-title {
  margin: 0;
  font-size: 22px;
  line-height: 1.3;
  overflow-wrap: anywhere;
}

.chart-summary {
  margin-left: 8px;
  color: #5b6070;
  font-size: 16px;
  font-weight: 500;
}

.chart-wrap {
  position: relative;
  height: auto;
  width: 100%;
  flex: 1;
  min-height: 0;
}

.empty {
  width: 100%;
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #5b6070;
  font-weight: 600;
  text-align: center;
  word-break: break-all;
  padding: 0 16px;
}
</style>
