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
import { isPrefixed, SELECT_PREFIXES } from "./useBenchmarkSelection";

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

function withAlpha(color: string, alpha: number): string {
  const hslMatch = color.match(/^hsl\(([^)]+)\)$/);
  if (hslMatch) {
    return `hsla(${hslMatch[1]}, ${alpha})`;
  }
  const hslaMatch = color.match(/^hsla\(([^,]+),([^,]+),([^,]+),[^)]+\)$/);
  if (hslaMatch) {
    return `hsla(${hslaMatch[1]},${hslaMatch[2]},${hslaMatch[3]},${alpha})`;
  }
  return color;
}

type HighlightDataset = ChartDataset<"line"> & {
  _baseColor?: string;
  _baseBorderWidth?: number;
  _basePointRadius?: number;
  _basePointHoverRadius?: number;
};

function applyLegendHighlight(chart: Chart, highlightedIndex: number | null) {
  const datasets = chart.data.datasets as HighlightDataset[];
  datasets.forEach((dataset, idx) => {
    const baseColor = dataset._baseColor ?? String(dataset.borderColor);
    const baseBorderWidth = dataset._baseBorderWidth ?? 2;
    const basePointRadius = dataset._basePointRadius ?? 3;
    const basePointHoverRadius = dataset._basePointHoverRadius ?? 5;

    if (highlightedIndex === null) {
      dataset.borderColor = baseColor;
      dataset.backgroundColor = baseColor;
      dataset.borderWidth = baseBorderWidth;
      dataset.pointRadius = basePointRadius;
      dataset.pointHoverRadius = basePointHoverRadius;
      dataset.hidden = false;
      return;
    }

    const isActive = idx === highlightedIndex;
    const alpha = isActive ? 1 : 0.18;
    dataset.borderColor = withAlpha(baseColor, alpha);
    dataset.backgroundColor = withAlpha(baseColor, alpha);
    dataset.borderWidth = isActive ? baseBorderWidth + 1 : Math.max(1, baseBorderWidth - 1);
    dataset.pointRadius = isActive ? basePointRadius + 1 : Math.max(1, basePointRadius - 1);
    dataset.pointHoverRadius = isActive
      ? basePointHoverRadius + 1
      : Math.max(2, basePointHoverRadius - 2);
    dataset.hidden = false;
  });
  chart.update();
}

function pointStyleFor(name: string): "circle" | "triangle" | "star" | "rect" {
  name = name.replace(/^\d+\./, ""); // remove numeric prefix
  if (name.startsWith("GEOMEAN")) return "star";
  if (isPrefixed(name, "SPEC06INT")) return "rect";
  if (isPrefixed(name, "SPEC06FP")) return "triangle";
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
  prefix: keyof typeof SELECT_PREFIXES,
): number | null {
  const scoped = Object.entries(payload).filter(([name]) =>
    isPrefixed(name, prefix),
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
    return computeScopedGeomean(payload, metricKey, "SPEC06INT");
  }
  if (benchmark === "GEOMEAN-SPEC06FP") {
    return computeScopedGeomean(payload, metricKey, "SPEC06FP");
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
  const isSinglePoint = labels.length === 1;
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
        _baseColor: color,
        _baseBorderWidth: isGeomean ? 4 : 2,
        _basePointRadius: isGeomean ? 6 : 3,
        _basePointHoverRadius: isGeomean ? 9 : 5,
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
          offset: isSinglePoint,
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
          onClick: (_event, legendItem, legend) => {
            const targetIndex = legendItem.datasetIndex;
            if (typeof targetIndex !== "number") return;
            const c = legend.chart as Chart & { _highlightedDatasetIndex?: number | null };
            const current = c._highlightedDatasetIndex ?? null;
            c._highlightedDatasetIndex = current === targetIndex ? null : targetIndex;
            applyLegendHighlight(c, c._highlightedDatasetIndex);
          },
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
