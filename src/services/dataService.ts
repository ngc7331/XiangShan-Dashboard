import type { ChartConfig } from "../config/tabs";
import {
  assertBranchList,
  assertReportPayload,
  assertRunIndex,
  type NormalizedRun,
  type ReportPayload,
} from "../types/data";

const dayMs = 24 * 60 * 60 * 1000;

async function fetchJson(path: string): Promise<unknown> {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`failed to fetch ${path}: ${response.status}`);
  }
  return response.json();
}

export async function loadBranchList(tab: ChartConfig): Promise<string[]> {
  const payloadRaw = await fetchJson(`${tab.datasetRoot}/branch.json`);
  return assertBranchList(payloadRaw);
}

function getDatasetPath(tab: ChartConfig, branch: string): string {
  if (tab.subset) {
    return `${tab.datasetRoot}/${branch}/${tab.subset}`;
  }
  return `${tab.datasetRoot}/${branch}`;
}

export async function loadRunIndex(
  tab: ChartConfig,
  branch: string,
): Promise<NormalizedRun[]> {
  const indexRaw = await fetchJson(`${getDatasetPath(tab, branch)}/data.json`);
  const index = assertRunIndex(indexRaw);
  return Object.entries(index.data)
    .map(([runId, entry]) => ({
      runId,
      hash: entry.hash,
      title: entry.title,
      dateMs: entry.date > 1e12 ? entry.date : entry.date * 1000,
      note: entry.note,
    }))
    .sort((a, b) => Number(a.runId) - Number(b.runId));
}

export async function loadReport(
  tab: ChartConfig,
  branch: string,
  hash: string,
): Promise<ReportPayload> {
  const payloadRaw = await fetchJson(
    `${getDatasetPath(tab, branch)}/${hash}.json`,
  );
  return assertReportPayload(payloadRaw);
}

export function formatInputDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function getDateRange(
  startDate: string,
  endDate: string,
): { startMs: number; endMs: number } {
  const start = new Date(`${startDate}T00:00:00`).getTime();
  const end = new Date(`${endDate}T23:59:59`).getTime();
  return { startMs: start, endMs: end };
}

export function formatDisplayDate(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
