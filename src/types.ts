export type CommandOptions = { [key: string]: string };

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
