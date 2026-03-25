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

export function selectPrefix(
  benchmarks: string[],
  prefix: keyof typeof SELECT_PREFIXES,
): string[] {
  const prefixes = SELECT_PREFIXES[prefix];
  return benchmarks.filter(
    (tc) =>
      prefixes.some((pf) => tc.startsWith(pf)) || tc === `GEOMEAN-${prefix}`,
  );
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
