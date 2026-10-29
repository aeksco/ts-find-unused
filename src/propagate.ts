import {
  Depth,
  MAX_DEPTH,
  RemovableFile,
  ScanResult,
  ScannedFile,
  SymbolRecord,
  SymbolRef,
  UnreferencedSymbol,
} from "./types";

// // // //

interface GraphNode {
  record: SymbolRecord;
  /** keys of scanned declarations that reference this symbol (self excluded) */
  usedBy: Set<string>;
  rooted: boolean;
}

function toRef(record: SymbolRecord): SymbolRef {
  const { label, relativePath, lineNumber } = record.symbol;
  return { label, relativePath, lineNumber };
}

function compareRefs(a: SymbolRef, b: SymbolRef): number {
  return (
    a.relativePath.localeCompare(b.relativePath) ||
    a.lineNumber - b.lineNumber ||
    a.label.localeCompare(b.label)
  );
}

/** Cycle members sort after every numeric depth */
function depthRank(entry: { depth?: number; cycle?: boolean }): number {
  return entry.cycle ? Number.POSITIVE_INFINITY : entry.depth ?? 0;
}

function compareRows(a: UnreferencedSymbol, b: UnreferencedSymbol): number {
  return depthRank(a) - depthRank(b) || compareRefs(a, b);
}

/**
 * buildGraph
 * Turns the flat list of records into graph nodes. An owner that was never scanned
 * (it lives in an excluded file, for instance) can never be reported as dead, so a
 * reference from it is as good as a root.
 */
function buildGraph(
  records: SymbolRecord[],
  ownerAliases: Map<string, string[]>
): Map<string, GraphNode> {
  const known = new Set(records.map((record) => record.key));
  const nodes = new Map<string, GraphNode>();
  for (const record of records) {
    const usedBy = new Set<string>();
    let rooted = record.rooted;
    for (const ownerKey of record.ownerKeys) {
      // A reference owned by `const { a, b } = ...` is owned by each of its bindings
      const owners = ownerAliases.get(ownerKey) ?? [ownerKey];
      for (const owner of owners) {
        if (owner === record.key) continue;
        if (known.has(owner)) {
          usedBy.add(owner);
        } else {
          rooted = true;
        }
      }
    }
    nodes.set(record.key, { record, usedBy, rooted });
  }
  return nodes;
}

/**
 * findDeadByDepth
 * Wave propagation. Depth 1 is every unrooted symbol nobody references. Each further
 * wave adds the unrooted symbols whose every referencing owner is already dead. Waves
 * are computed against the previous level only, so the depth a symbol lands on does
 * not depend on iteration order.
 */
function findDeadByDepth(
  nodes: Map<string, GraphNode>,
  maxDepth: number
): { deadDepth: Map<string, number>; depthReached: number } {
  const deadDepth = new Map<string, number>();
  let depthReached = 0;

  for (let level = 1; level <= maxDepth; level++) {
    const wave: string[] = [];
    for (const [key, node] of nodes) {
      if (node.rooted || deadDepth.has(key)) continue;
      let everyOwnerDead = true;
      for (const owner of node.usedBy) {
        if (!deadDepth.has(owner)) {
          everyOwnerDead = false;
          break;
        }
      }
      if (everyOwnerDead) wave.push(key);
    }
    if (wave.length === 0) break;
    wave.forEach((key) => deadDepth.set(key, level));
    depthReached = level;
  }

  return { deadDepth, depthReached };
}

/**
 * findDeadCycles
 * Mark-and-sweep from the rooted symbols. Whatever is neither rooted, nor reachable
 * from a root, nor already found by wave propagation is only kept alive by a cycle
 * of other dead symbols.
 */
function findDeadCycles(
  nodes: Map<string, GraphNode>,
  deadDepth: Map<string, number>
): Set<string> {
  // owner -> the symbols it references
  const uses = new Map<string, Set<string>>();
  for (const [key, node] of nodes) {
    for (const owner of node.usedBy) {
      let targets = uses.get(owner);
      if (targets === undefined) {
        targets = new Set<string>();
        uses.set(owner, targets);
      }
      targets.add(key);
    }
  }

  const alive = new Set<string>();
  const queue: string[] = [];
  for (const [key, node] of nodes) {
    if (node.rooted) queue.push(key);
  }
  while (queue.length > 0) {
    const key = queue.pop() as string;
    if (alive.has(key)) continue;
    alive.add(key);
    const targets = uses.get(key);
    if (targets === undefined) continue;
    for (const target of targets) {
      if (!alive.has(target)) queue.push(target);
    }
  }

  const cycles = new Set<string>();
  for (const [key, node] of nodes) {
    if (!node.rooted && !deadDepth.has(key) && !alive.has(key)) {
      cycles.add(key);
    }
  }
  return cycles;
}

/**
 * UnionFind
 * Minimal disjoint-set used to group dead symbols into removal clusters
 */
class UnionFind {
  private parent = new Map<string, string>();

  find(key: string): string {
    let root = key;
    while (this.parent.get(root) !== undefined && this.parent.get(root) !== root) {
      root = this.parent.get(root) as string;
    }
    // Path compression
    let current = key;
    while (current !== root) {
      const next = this.parent.get(current) as string;
      this.parent.set(current, root);
      current = next;
    }
    return root;
  }

  union(a: string, b: string): void {
    const rootA = this.find(a);
    const rootB = this.find(b);
    if (rootA !== rootB) this.parent.set(rootA, rootB);
  }
}

/**
 * findRemovableFiles
 * Files where every top-level declaration is dead and nothing else would be lost
 */
function findRemovableFiles(
  files: ScannedFile[],
  deadDepth: Map<string, number>,
  cycleKeys: Set<string>
): RemovableFile[] {
  const isDead = (key: string) => deadDepth.has(key) || cycleKeys.has(key);
  const removable: RemovableFile[] = [];

  for (const file of files) {
    if (!file.deletable || file.declarationKeys.length === 0) continue;
    // A declaration we failed to scan might be alive - never recommend deleting around it
    if (file.unscannedDeclarations > 0) continue;
    if (!file.declarationKeys.every(isDead)) continue;

    const depths = file.declarationKeys
      .map((key) => deadDepth.get(key))
      .filter((depth): depth is number => depth !== undefined);
    const entry: RemovableFile = {
      filepath: file.filepath,
      relativePath: file.relativePath,
      symbolCount: file.declarationKeys.length,
    };
    if (depths.length > 0) entry.depth = Math.max(...depths);
    if (file.declarationKeys.some((key) => cycleKeys.has(key))) entry.cycle = true;
    removable.push(entry);
  }

  return removable.sort(
    (a, b) => depthRank(a) - depthRank(b) || a.relativePath.localeCompare(b.relativePath)
  );
}

// // // //

/**
 * propagate
 * Walks the reference graph built from the scanned records and decides what is dead.
 *
 *   depth 1     -> symbols with no live references (the classic result)
 *   depth n     -> plus symbols whose every reference comes from a symbol dead at a lower depth
 *   depth "max" -> the fixed point of the above, plus symbols only kept alive by dead cycles
 *
 * Members of an enum that is itself dead are dropped from the report - the enum row covers them.
 */
export function propagate(props: {
  records: SymbolRecord[];
  files: ScannedFile[];
  depth: Depth;
  /** destructuring declaration key -> keys of its bindings */
  ownerAliases?: Map<string, string[]>;
}): ScanResult {
  const { records, files, depth, ownerAliases = new Map<string, string[]>() } = props;
  const maxDepth = depth === MAX_DEPTH ? Number.POSITIVE_INFINITY : depth;

  const nodes = buildGraph(records, ownerAliases);
  const { deadDepth, depthReached } = findDeadByDepth(nodes, maxDepth);
  const cycleKeys =
    depth === MAX_DEPTH ? findDeadCycles(nodes, deadDepth) : new Set<string>();
  const isDead = (key: string) => deadDepth.has(key) || cycleKeys.has(key);

  // One row per dead symbol, except members of an enum that is itself dead
  const rowsByKey = new Map<string, UnreferencedSymbol>();
  const clusters = new UnionFind();
  for (const [key, node] of nodes) {
    if (!isDead(key)) continue;
    const { parentKey } = node.record;
    if (parentKey !== undefined && isDead(parentKey)) continue;

    const row: UnreferencedSymbol = { ...node.record.symbol };
    const level = deadDepth.get(key);
    if (level !== undefined) row.depth = level;
    if (cycleKeys.has(key)) row.cycle = true;
    row.unusedAfter = [...node.usedBy]
      .map((ownerKey) => toRef((nodes.get(ownerKey) as GraphNode).record))
      .sort(compareRefs);
    rowsByKey.set(key, row);
    node.usedBy.forEach((ownerKey) => clusters.union(key, ownerKey));
  }

  // Stable order: shallow first, then by file and line. Cluster ids follow that order.
  const ordered = [...rowsByKey.entries()].sort(([, a], [, b]) => compareRows(a, b));
  const clusterIds = new Map<string, number>();
  const unused: UnreferencedSymbol[] = ordered.map(([key, row]) => {
    const root = clusters.find(key);
    let clusterId = clusterIds.get(root);
    if (clusterId === undefined) {
      clusterId = clusterIds.size + 1;
      clusterIds.set(root, clusterId);
    }
    return { ...row, clusterId };
  });

  const cycles = unused.filter((row) => row.cycle === true).length;
  const direct = unused.filter((row) => row.depth === 1).length;

  return {
    unused,
    removableFiles: findRemovableFiles(files, deadDepth, cycleKeys),
    summary: {
      total: unused.length,
      direct,
      transitive: unused.length - direct - cycles,
      cycles,
      depthReached,
    },
  };
}
