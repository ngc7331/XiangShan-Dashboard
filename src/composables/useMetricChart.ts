import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend,
  type ChartDataset,
} from "chart.js";
import type { DashboardTabConfig } from "../config/tabs";
import type { NormalizedRun, ReportPayload } from "../types/data";
import { formatDisplayDate } from "../services/dataService";
import { SELECT_PREFIXES } from "./useBenchmarkSelection";

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend,
);

function colorForIndex(i: number): string {
  const hue = (i * 47) % 360;
  return `hsl(${hue}, 72%, 52%)`;
}

function pointStyleFor(name: string): "circle" | "triangle" | "star" | "rect" {
  if (name.startsWith("GEOMEAN")) return "star";
  if (SELECT_PREFIXES.SPEC06INT.some((prefix) => name.startsWith(prefix)))
    return "rect";
  if (SELECT_PREFIXES.SPEC06FP.some((prefix) => name.startsWith(prefix)))
    return "triangle";
  return "circle";
}

function computeGeomean(
  payload: ReportPayload,
  metricKey: "ipc" | "score",
): number | null {
  const values = Object.values(payload)
    .map((entry) => entry?.[metricKey] ?? null)
    .filter((v): v is number => typeof v === "number" && v > 0);

  if (!values.length) return null;
  const logSum = values.reduce((acc, v) => acc + Math.log(v), 0);
  return Math.exp(logSum / values.length);
}

function computeScopedGeomean(
  payload: ReportPayload,
  metricKey: "ipc" | "score",
  prefixes: readonly string[],
): number | null {
  const scoped = Object.entries(payload).filter(([name]) =>
    prefixes.some((prefix) => name.startsWith(prefix)),
  );
  if (!scoped.length) return null;

  const values = scoped
    .map(([, entry]) => entry?.[metricKey] ?? null)
    .filter((v): v is number => typeof v === "number" && v > 0);

  if (!values.length) return null;
  const logSum = values.reduce((acc, v) => acc + Math.log(v), 0);
  return Math.exp(logSum / values.length);
}

function resolveValue(
  payload: ReportPayload | undefined,
  benchmark: string,
  metricKey: "ipc" | "score",
): number | null {
  if (!payload) return null;
  if (benchmark === "GEOMEAN") return computeGeomean(payload, metricKey);
  if (benchmark === "GEOMEAN-SPEC06INT") {
    return computeScopedGeomean(payload, metricKey, SELECT_PREFIXES.SPEC06INT);
  }
  if (benchmark === "GEOMEAN-SPEC06FP") {
    return computeScopedGeomean(payload, metricKey, SELECT_PREFIXES.SPEC06FP);
  }
  const value = payload[benchmark]?.[metricKey];
  return typeof value === "number" ? value : null;
}

export function renderMetricChart(args: {
  canvas: HTMLCanvasElement;
  chart: Chart | null;
  tab: DashboardTabConfig;
  runs: NormalizedRun[];
  selectedBenchmarks: string[];
  runDataByHash: Record<string, ReportPayload>;
  t: (key: string) => string;
}): Chart | null {
  const { canvas, chart, tab, runs, selectedBenchmarks, runDataByHash, t } =
    args;

  if (chart) {
    chart.destroy();
  }

  if (!runs.length || !selectedBenchmarks.length) {
    return null;
  }

  const labels = runs.map((run) =>
    tab.axisMode === "date" ? formatDisplayDate(run.dateMs) : run.runId,
  );
  const metricLabel = tab.metricKey === "ipc" ? "IPC" : "Score";
  const datasets: ChartDataset<"line">[] = selectedBenchmarks.map(
    (name, idx) => {
      const color = colorForIndex(idx);
      const isGeomean = name.startsWith("GEOMEAN");
      return {
        label: name,
        data: runs.map((run) =>
          resolveValue(runDataByHash[run.hash], name, tab.metricKey),
        ),
        borderColor: color,
        backgroundColor: color,
        tension: 0,
        spanGaps: true,
        pointRadius: isGeomean ? 6 : 3,
        pointHoverRadius: isGeomean ? 9 : 5,
        borderWidth: isGeomean ? 4 : 2,
        pointStyle: pointStyleFor(name),
      };
    },
  );

  return new Chart(canvas, {
    type: "line",
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 0 },
      interaction: { mode: "nearest", intersect: false },
      scales: {
        x: {
          title: {
            display: true,
            text: tab.axisMode === "date" ? t("dateAxis") : t("runIdAxis"),
          },
          ticks: { maxRotation: 25, minRotation: 25 },
        },
        y: {
          title: { display: true, text: metricLabel },
          beginAtZero: false,
        },
      },
      plugins: {
        legend: {
          labels: { boxWidth: 12, color: "#1c1f2a" },
        },
        tooltip: {
          callbacks: {
            title: (items) => runs[items[0].dataIndex]?.title || "",
            label: (item) =>
              `${item.dataset.label}: ${metricLabel} ${item.formattedValue}`,
            afterLabel: (item) => {
              const run = runs[item.dataIndex];
              if (!run) return [];
              return [
                `${t("runId")}: ${run.runId}`,
                `${t("date")}: ${formatDisplayDate(run.dateMs)}`,
              ];
            },
          },
        },
      },
    },
  });
}
