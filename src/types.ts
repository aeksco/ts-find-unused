export interface CommandOptions {
  // New parameter names (v2.0+)
  excludeFiles?: string[];
  ignoreUsagesIn?: string[];
  ignoreUsagesInRegex?: string[];

  // Old parameter names (deprecated, kept for backward compatibility)
  /** @deprecated Use excludeFiles instead - will be removed in v3.0 */
  ignorePatterns?: string[];
  /** @deprecated Use ignoreUsagesIn instead - will be removed in v3.0 */
  referenceIgnorePatterns?: string[];
  /** @deprecated Use ignoreUsagesInRegex instead - will be removed in v3.0 */
  referenceIgnoreRegex?: string[];

  // Other options
  output?: OutputFormat;
  destination?: string;
  projectPath?: string;
  tsconfigPath?: string;
  logLevel?: LogLevel;
  debug?: boolean;
  failOnFound?: boolean;
  checkEnumMembers?: boolean;
  depth?: Depth;
  reexportsAreUsages?: boolean;
}

// // // //

/**
 * Depth
 * How many levels of transitive dead code to follow.
 *   1     -> only symbols with no live references at all (the classic behaviour)
 *   n     -> also symbols whose every reference comes from a symbol found at a depth below n
 *   "max" -> keep going until nothing new turns up, and also report dead cycles
 */
export const MAX_DEPTH = "max" as const;
export type Depth = number | typeof MAX_DEPTH;

/**
 * OutputFormat
 * Different output formates supported by the program
 */
export type OutputFormat = "txt" | "markdown" | "json";
export enum OutputFormats {
  txt = "txt",
  markdown = "markdown",
  json = "json",
}

/**
 * LogLevel
 * Dictates the level of detail in program logs
 */
export type LogLevel = "none" | "info" | "verbose";
export enum LogLevels {
  none = "none",
  info = "info",
  verbose = "verbose",
}

/**
 * SymbolType
 * Different types of unused symbols recognized by the program
 */
export type SymbolType =
  | "interface"
  | "class"
  | "enum"
  | "function"
  | "type-alias"
  | "variable";
export enum SymbolTypes {
  interface = "interface",
  class = "class",
  enum = "enum",
  function = "function",
  typeAlias = "type-alias",
  variable = "variable",
}

/**
 * SymbolRef
 * A lightweight pointer to another symbol in the report
 */
export interface SymbolRef {
  label: string;
  relativePath: string;
  lineNumber: number;
}

/**
 * UnreferencedSymbol
 * Encapsulates a reference to a single unused symbol in the TS project
 */
export interface UnreferencedSymbol {
  label: string;
  filepath: string;
  relativePath: string;
  lineNumber: number;
  type: SymbolType;
  /**
   * 1 = nothing references this symbol at all.
   * n = it becomes unreferenced once everything reported at a depth below n is removed.
   * Absent for members of a dead cycle.
   */
  depth?: number;
  /** true when the symbol is only kept alive by a cycle of otherwise-dead symbols (reported with depth "max" only) */
  cycle?: boolean;
  /** the dead symbols that still reference this one - remove them first */
  unusedAfter?: SymbolRef[];
  /** symbols connected through unusedAfter edges share a clusterId - they can be removed together */
  clusterId?: number;
}

/**
 * RemovableFile
 * A file whose every top-level declaration is unused and that holds nothing else worth keeping
 */
export interface RemovableFile {
  filepath: string;
  relativePath: string;
  /** number of top-level declarations in the file (enum members are not counted) */
  symbolCount: number;
  /** depth of the deepest declaration in the file; absent when the file only holds cycle members */
  depth?: number;
  cycle?: boolean;
}

/**
 * ScanSummary
 * Headline numbers for a scan
 */
export interface ScanSummary {
  total: number;
  direct: number;
  transitive: number;
  cycles: number;
  /** the deepest numeric depth that produced at least one symbol (0 when nothing was found) */
  depthReached: number;
}

/**
 * ScanResult
 * Everything scanProject produces
 */
export interface ScanResult {
  unused: UnreferencedSymbol[];
  removableFiles: RemovableFile[];
  summary: ScanSummary;
}

// // // //
// Internal types used while building the reference graph

/**
 * SymbolRecord
 * One scanned declaration plus everything the reference graph needs to know about it
 */
export interface SymbolRecord {
  /** `${filepath}#${startOffset}` - the same node yields the same key when found as an owner */
  key: string;
  symbol: UnreferencedSymbol;
  /** keys of the top-level declarations whose bodies reference this symbol (self references excluded) */
  ownerKeys: Set<string>;
  /** true when at least one reference keeps the symbol alive unconditionally (module-level code, export default, ...) */
  rooted: boolean;
  /** enum members only: key of the parent enum */
  parentKey?: string;
}

/**
 * ScannedFile
 * Per-file facts needed to decide whether a whole file can be deleted
 */
export interface ScannedFile {
  filepath: string;
  relativePath: string;
  /** keys of the top-level declarations (and destructured bindings) that produced a SymbolRecord */
  declarationKeys: string[];
  /** number of top-level declarations whose references could not be resolved - they might be alive */
  unscannedDeclarations: number;
  /** false when the file holds statements that deleting it would lose: side effects, re-exports, namespaces, ... */
  deletable: boolean;
}
