export type CommandOptions = { [key: string]: string };

// // // //

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
  variable = "variable"
}

export interface UnreferencedSymbol {
  label: string;
  filepath: string;
  relativePath: string;
  lineNumber: number;
  type: SymbolType;
}

export type OutputFormat = "txt" | "markdown" | "json";
export enum OutputFormats {
  txt = "txt",
  markdown = "markdown",
  json = "json"
}
