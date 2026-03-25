<template>
  <div class="chart-shell">
    <div class="chart-wrap" v-if="hasData">
      <canvas ref="canvasRef"></canvas>
    </div>
    <div class="empty" v-else>
      {{ noDataText }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { Chart } from "chart.js";
import type { DashboardTabConfig } from "../../config/tabs";
import type { NormalizedRun, ReportPayload } from "../../types/data";
import { renderMetricChart } from "../../composables/useMetricChart";

const props = defineProps<{
  tab: DashboardTabConfig;
  runs: NormalizedRun[];
  selectedBenchmarks: string[];
  runDataByHash: Record<string, ReportPayload>;
  noDataText: string;
  t: (key: string) => string;
}>();

const canvasRef = ref<HTMLCanvasElement | null>(null);
let chart: Chart | null = null;

const hasData = ref(false);

function redraw() {
  hasData.value = props.runs.length > 0 && props.selectedBenchmarks.length > 0;
  if (!canvasRef.value) return;
  chart = renderMetricChart({
    canvas: canvasRef.value,
    chart,
    tab: props.tab,
    runs: props.runs,
    selectedBenchmarks: props.selectedBenchmarks,
    runDataByHash: props.runDataByHash,
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
  ],
  redraw,
  { deep: true },
);

onBeforeUnmount(() => {
  if (chart) chart.destroy();
});
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
}

.chart-wrap {
  position: relative;
  height: 100%;
  width: 100%;
  flex: 1;
}

.empty {
  min-height: 360px;
  width: 100%;
  flex: 1;
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
