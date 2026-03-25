import type { DashboardTabConfig } from "../config/tabs";
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

async function loadBranchListByRoot(root: string): Promise<string[]> {
  const payload = await fetchJson(`${root}/branch.json`);
  return assertBranchList(payload);
}

export async function loadBranchList(
  tab: DashboardTabConfig,
): Promise<string[]> {
  try {
    return await loadBranchListByRoot(tab.datasetRoot);
  } catch (err) {
    if (tab.id === "ipc-commit") {
      const legacy = await fetchJson("data/branch.json");
      return assertBranchList(legacy);
    }
    throw err;
  }
}

export async function loadRunIndex(
  tab: DashboardTabConfig,
  branch: string,
): Promise<NormalizedRun[]> {
  let indexRaw: unknown;
  try {
    indexRaw = await fetchJson(`${tab.datasetRoot}/${branch}/data.json`);
  } catch (err) {
    if (tab.id === "ipc-commit") {
      indexRaw = await fetchJson(`data/${branch}/data.json`);
    } else {
      throw err;
    }
  }

  const index = assertRunIndex(indexRaw);
  return Object.entries(index.data)
    .map(([runId, entry]) => ({
      runId,
      hash: entry.hash,
      title: entry.title,
      dateMs: entry.date > 1e12 ? entry.date : entry.date * 1000,
    }))
    .sort((a, b) => Number(a.runId) - Number(b.runId));
}

export async function loadReport(
  tab: DashboardTabConfig,
  branch: string,
  hash: string,
): Promise<ReportPayload> {
  let payloadRaw: unknown;
  try {
    payloadRaw = await fetchJson(`${tab.datasetRoot}/${branch}/${hash}.json`);
  } catch (err) {
    if (tab.id === "ipc-commit") {
      payloadRaw = await fetchJson(`data/${branch}/${hash}.json`);
    } else {
      throw err;
    }
  }
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
