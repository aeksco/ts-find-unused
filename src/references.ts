import {
  ClassDeclaration,
  EnumDeclaration,
  FunctionDeclaration,
  InterfaceDeclaration,
  Node,
  ReferencedSymbol,
  ReferencedSymbolEntry,
  SyntaxKind,
  TypeAliasDeclaration,
  VariableDeclaration,
} from "ts-morph";
import { LogLevel, LogLevels } from "./types";

// // // //

/**
 * TrackedDeclaration
 * The top-level declaration kinds the scanner knows about. A reference found inside
 * one of these is "owned" by it; a reference found anywhere else is a root.
 */
export type TrackedDeclaration =
  | FunctionDeclaration
  | ClassDeclaration
  | InterfaceDeclaration
  | TypeAliasDeclaration
  | EnumDeclaration
  | VariableDeclaration;

export function isTrackedDeclaration(
  node: Node | undefined
): node is TrackedDeclaration {
  return (
    Node.isFunctionDeclaration(node) ||
    Node.isClassDeclaration(node) ||
    Node.isInterfaceDeclaration(node) ||
    Node.isTypeAliasDeclaration(node) ||
    Node.isEnumDeclaration(node) ||
    Node.isVariableDeclaration(node)
  );
}

/**
 * nodeKey
 * Stable identity for a declaration: the same node always yields the same key,
 * whether we reach it by scanning a file or by climbing up from a reference.
 */
export function nodeKey(node: Node): string {
  return `${node.getSourceFile().getFilePath()}#${node.getStart()}`;
}

/**
 * findOwner
 * Climbs from a reference node to the top-level declaration that contains it.
 * Returns undefined for references that sit in module-level code, imports/exports,
 * namespaces, or anything else the scanner does not track.
 */
export function findOwner(node: Node): TrackedDeclaration | undefined {
  // Climb to the statement that is a direct child of the source file
  let top: Node = node;
  let parent = top.getParent();
  while (parent !== undefined && !Node.isSourceFile(parent)) {
    top = parent;
    parent = top.getParent();
  }
  if (parent === undefined) {
    return undefined;
  }

  // `const a = 1, b = fnA()` - the owner is the individual declaration, not the statement
  if (Node.isVariableStatement(top)) {
    const list = top.getDeclarationList();
    return node.getFirstAncestor(
      (ancestor: Node): ancestor is VariableDeclaration =>
        Node.isVariableDeclaration(ancestor) && ancestor.getParent() === list
    );
  }

  return isTrackedDeclaration(top) ? top : undefined;
}

/**
 * isPropertyNameReference
 * TypeScript links a destructured binding (`const { x } = obj`) to the property it
 * reads, so the property's own name in an object literal, interface or class shows
 * up among the binding's references. That name defines a property; it does not use
 * the binding.
 */
function isPropertyNameReference(node: Node): boolean {
  const parent = node.getParent();
  if (parent === undefined) {
    return false;
  }
  if (
    Node.isPropertyAssignment(parent) ||
    Node.isPropertySignature(parent) ||
    Node.isPropertyDeclaration(parent) ||
    Node.isMethodDeclaration(parent) ||
    Node.isMethodSignature(parent) ||
    Node.isGetAccessorDeclaration(parent) ||
    Node.isSetAccessorDeclaration(parent)
  ) {
    return parent.getNameNode() === node;
  }
  return false;
}

// // // //

/**
 * ReferenceKind
 *   definition  - the declaration itself (or an overload signature / merged declaration)
 *   ignored     - sits in a file matched by ignoreUsagesIn / ignoreUsagesInRegex
 *   passThrough - an import or re-export specifier: not a use by itself, the real use shows up elsewhere
 *   self        - sits inside the symbol's own declaration (recursion)
 *   owned       - sits inside another tracked top-level declaration
 *   root        - anything else: module-level code, export default, untracked constructs
 */
export type ReferenceKind =
  | "definition"
  | "ignored"
  | "passThrough"
  | "self"
  | "owned"
  | "root";

export interface ClassifiedReference {
  kind: ReferenceKind;
  path: string;
  ownerKey?: string;
}

export interface ReferenceClassifier {
  classify(reference: ReferencedSymbolEntry, selfKey: string): ClassifiedReference;
  classifyAll(
    referencedSymbols: ReferencedSymbol[],
    selfKey: string
  ): ClassifiedReference[];
}

/**
 * Parents that mark a reference as an import alias rather than a usage.
 * TypeScript resolves usages through these aliases, so the real usages
 * show up as separate references with their own owners.
 */
const PASS_THROUGH_PARENTS = new Set<SyntaxKind>([
  SyntaxKind.ImportSpecifier,
  SyntaxKind.ImportClause,
  SyntaxKind.NamespaceImport,
  SyntaxKind.ImportEqualsDeclaration,
]);

/**
 * createReferenceClassifier
 * Compiles the ignore patterns once and returns a classifier for reference entries
 */
export function createReferenceClassifier(options: {
  referenceIgnorePatterns: string[];
  referenceIgnoreRegex: string[];
  reexportsAreUsages: boolean;
  logLevel: LogLevel;
}): ReferenceClassifier {
  const { referenceIgnorePatterns, referenceIgnoreRegex, reexportsAreUsages, logLevel } =
    options;

  const patterns = referenceIgnorePatterns.filter((pattern) => pattern !== "");
  const regexes: RegExp[] = [];
  referenceIgnoreRegex.forEach((pattern) => {
    if (!pattern) return;
    try {
      regexes.push(new RegExp(pattern));
    } catch (e) {
      // If the regex is invalid, log a warning and skip it
      if (logLevel === LogLevels.verbose) {
        const message = e instanceof Error ? e.message : String(e);
        console.log(`Invalid regex pattern: ${pattern}. Error: ${message}`);
      }
    }
  });

  const isIgnoredPath = (path: string): boolean =>
    patterns.some((pattern) => path.includes(pattern)) ||
    regexes.some((regex) => regex.test(path));

  const classify = (
    reference: ReferencedSymbolEntry,
    selfKey: string
  ): ClassifiedReference => {
    const path = reference.getSourceFile().getFilePath();
    if (reference.isDefinition()) {
      return { kind: "definition", path };
    }
    if (isIgnoredPath(path)) {
      return { kind: "ignored", path };
    }

    const node = reference.getNode();
    if (isPropertyNameReference(node)) {
      return { kind: "definition", path };
    }
    const parentKind = node.getParent()?.getKind();
    if (parentKind !== undefined && PASS_THROUGH_PARENTS.has(parentKind)) {
      return { kind: "passThrough", path };
    }
    if (parentKind === SyntaxKind.ExportSpecifier) {
      // `export { x }` / `export { x } from "./y"` - a re-export is not a use unless asked to count it
      return { kind: reexportsAreUsages ? "root" : "passThrough", path };
    }

    const owner = findOwner(node);
    if (owner === undefined) {
      return { kind: "root", path };
    }
    const ownerKey = nodeKey(owner);
    if (ownerKey === selfKey) {
      return { kind: "self", path };
    }
    return { kind: "owned", path, ownerKey };
  };

  const classifyAll = (
    referencedSymbols: ReferencedSymbol[],
    selfKey: string
  ): ClassifiedReference[] => {
    const classified: ClassifiedReference[] = [];
    for (const referencedSymbol of referencedSymbols) {
      for (const reference of referencedSymbol.getReferences()) {
        classified.push(classify(reference, selfKey));
      }
    }
    return classified;
  };

  return { classify, classifyAll };
}
