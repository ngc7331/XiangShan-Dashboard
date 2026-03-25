export const SELECT_PREFIXES = {
  SPEC06INT: [
    "perlbench",
    "bzip2",
    "gcc",
    "mcf",
    "gobmk",
    "hmmer",
    "sjeng",
    "libquantum",
    "h264ref",
    "omnetpp",
    "astar",
    "xalancbmk",
  ],
  SPEC06FP: [
    "bwaves",
    "gamess",
    "milc",
    "zeusmp",
    "gromacs",
    "cactusADM",
    "leslie3d",
    "namd",
    "dealII",
    "soplex",
    "povray",
    "calculix",
    "GemsFDTD",
    "tonto",
    "lbm",
    "wrf",
    "sphinx3",
    "specrand",
  ],
} as const;

export function selectDefault(benchmarks: string[]): string[] {
  const nonLegacy = benchmarks.filter((tc) => !tc.startsWith("legacy-"));
  return nonLegacy.length ? nonLegacy : [...benchmarks];
}

export function isPrefixed(
  name: string,
  prefix: keyof typeof SELECT_PREFIXES,
): boolean {
  return (
    SELECT_PREFIXES[prefix].some((pf) =>
      name.replace(/^\d+\./, "").startsWith(pf),
    ) || name === `GEOMEAN-${prefix}`
  );
}

export function selectPrefix(
  benchmarks: string[],
  prefix: keyof typeof SELECT_PREFIXES,
): string[] {
  return benchmarks.filter((tc) => isPrefixed(tc, prefix));
}

export function toggleSelection(
  all: string[],
  selected: string[],
  name: string,
): string[] {
  const set = new Set(selected);
  if (set.has(name)) set.delete(name);
  else set.add(name);
  return all.filter((tc) => set.has(tc));
}
