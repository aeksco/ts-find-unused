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
}

// // // //

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
 * UnreferencesSymbol
 * Encapsulates a reference to a single unused symbol in the TS project
 */
export interface UnreferencedSymbol {
  label: string;
  filepath: string;
  relativePath: string;
  lineNumber: number;
  type: SymbolType;
}
