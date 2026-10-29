import { Node, ReferenceFindableNode } from "ts-morph";
import { ReferenceClassifier, nodeKey } from "./references";
import { LogLevel, LogLevels, SymbolRecord, SymbolType } from "./types";

// // // //

/** Labels longer than this are cut and end in "..." */
export const MAX_LABEL_LENGTH = 120;

/**
 * normalizeLabel
 * Labels end up in single-line table cells and log lines: collapse any run of
 * whitespace (a destructuring pattern spans several lines) and cap the length.
 */
export function normalizeLabel(name: string): string {
  const collapsed = name.replace(/\s+/g, " ").trim();
  if (collapsed.length <= MAX_LABEL_LENGTH) {
    return collapsed;
  }
  return `${collapsed.slice(0, MAX_LABEL_LENGTH - 3)}...`;
}

/**
 * getSymbolName
 * Human-readable name of a declaration, with sensible fallbacks for anonymous default exports
 */
export function getSymbolName(node: Node): string {
  const named = node as Node & { getName?: () => string | undefined };
  const name = typeof named.getName === "function" ? named.getName() : undefined;
  if (name) {
    return name;
  }
  if (Node.isExportable(node) && node.isDefaultExport()) {
    return "default";
  }
  return "unknown";
}

/**
 * collectSymbolRecord
 * Looks up every reference to a declaration and classifies each one, producing the
 * node of the reference graph that `propagate` later walks. No verdict is made here.
 *
 * Returns undefined when the language service cannot resolve the node at all (not
 * even its definition comes back) - such a symbol is unknown, not unused.
 */
export function collectSymbolRecord(props: {
  node: Node & ReferenceFindableNode;
  label: string;
  type: SymbolType;
  projectRoot: string;
  classifier: ReferenceClassifier;
  logLevel: LogLevel;
  parentKey?: string;
  /** key under which references count as self references; defaults to the node's own key */
  selfKey?: string;
}): SymbolRecord | undefined {
  const { node, type, projectRoot, classifier, logLevel, parentKey } = props;
  const key = nodeKey(node);
  const selfKey = props.selfKey ?? key;
  const label = normalizeLabel(props.label);
  const filepath = node.getSourceFile().getFilePath();

  const classified = classifier.classifyAll(node.findReferences(), selfKey);
  if (classified.length === 0) {
    if (logLevel === LogLevels.verbose) {
      console.log(`Warning: no references found for ${label} in ${filepath}, skipping`);
    }
    return undefined;
  }

  const ownerKeys = new Set<string>();
  let rooted = false;
  for (const reference of classified) {
    if (reference.kind === "owned" && reference.ownerKey !== undefined) {
      ownerKeys.add(reference.ownerKey);
    } else if (reference.kind === "root") {
      rooted = true;
    }
  }

  if (logLevel === LogLevels.verbose) {
    const counts: Record<string, number> = {};
    classified.forEach((reference) => {
      counts[reference.kind] = (counts[reference.kind] ?? 0) + 1;
    });
    console.log(`${label} (${type}) references:`, counts);
  }

  return {
    key,
    symbol: {
      label,
      type,
      filepath,
      relativePath: filepath.replace(projectRoot, ""),
      lineNumber: node.getStartLineNumber(),
    },
    ownerKeys,
    rooted,
    parentKey,
  };
}

/**
 * isDirectlyUnused
 * True when nothing at all references the symbol - the depth-1 verdict
 */
export function isDirectlyUnused(record: SymbolRecord): boolean {
  return !record.rooted && record.ownerKeys.size === 0;
}
