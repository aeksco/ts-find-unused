import {
  ClassDeclaration,
  EnumDeclaration,
  FunctionDeclaration,
  InterfaceDeclaration,
  ReferencedSymbol,
  TypeAliasDeclaration,
  VariableDeclaration,
} from "ts-morph";
import { SymbolType, UnreferencedSymbol, LogLevel, LogLevels } from "./types";

// // // //

/**
 * Type-union for the different symbols we lookup
 */
type Symbol =
  | TypeAliasDeclaration
  | FunctionDeclaration
  | ClassDeclaration
  | EnumDeclaration
  | InterfaceDeclaration
  | VariableDeclaration;

/**
 * Interface for tracking a reference to a symbol
 */
interface TrackedReference {
  path: string;
  isDefinition: boolean;
}

/**
 * Gets the human-readable name of a symbol within the codebase
 */
function getSymbolName(symbol: Symbol): string {
  try {
    // @ts-ignore
    return symbol.getNodeProperty("name")._compilerNode.escapedText;
  } catch (e) {
    if (symbol && typeof symbol.getName === 'function') {
      return symbol.getName();
    }
    return "unknown";
  }
}

/**
 * findUnusedIdentifiers
 * Finds all references for a type alias
 * @param symbol
 * @returns UnusedIdentifier[]
 */
export function findUnusedIdentifiers(props: {
  symbol:
    | TypeAliasDeclaration
    | FunctionDeclaration
    | ClassDeclaration
    | EnumDeclaration
    | InterfaceDeclaration
    | VariableDeclaration;
  projectRoot: string;
  type: SymbolType;
  logLevel: LogLevel;
  referenceIgnorePatterns: string[];
}): UnreferencedSymbol[] {
  const { symbol, projectRoot, type, logLevel, referenceIgnorePatterns } =
    props;

  // Lookup array of references
  const references: ReferencedSymbol[] = symbol.findReferences();

  // Log start message with verbose logLevel
  if (logLevel === LogLevels.verbose) {
    console.log("- - - - - - - - - - - - - - - - - - - -");
    console.log(`findUnusedIdentifiers: ${getSymbolName(symbol)}`);
    console.log("- - - - - - - - - - - - - - - - - - - -");
  }

  // Log detailed output of each reference
  let allReferences: TrackedReference[] = [];
  for (const ref of references) {
    for (const r of ref.getReferences()) {
      // Push each reference into the allReferences array
      allReferences.push({
        path: r.getSourceFile().getFilePath(),
        isDefinition: r.compilerObject.isDefinition,
      });
    }
  }

  // Log number of references found IFF logLevel is verbose
  if (logLevel !== LogLevels.none) {
    console.log(`Found references: ${allReferences.length}`);
  }

  // Define local variables for unused identifier
  let unusedIdentifiers: UnreferencedSymbol[] = [];
  let symbolName = "";
  let lineNumber = -1;

  // Log error message and return empty array if there are no references
  if (allReferences.length === 0) {
    if (logLevel === LogLevels.verbose) {
      console.log(`Warning: No references found for symbol ${getSymbolName(symbol)} in ${symbol.getSourceFile().getFilePath()}`);
    }
    return [];
  }

  // Make a filtered array of references that are *not* the definition
  // References with the `isDefinition` flag include exports and the original definition
  const nonDefinitionReferences = allReferences.filter(
    (r) => r.isDefinition === false
  );

  // Mark as unused if there is only ONE reference (or zero non-definition references)
  if (allReferences.length === 1 || nonDefinitionReferences.length === 0) {
    try {
      lineNumber = symbol.getStartLineNumber();
      symbolName = getSymbolName(symbol);
    } catch (e) {
      // Log warning message if symbol name cannot be found
      if (logLevel === LogLevels.verbose) {
        console.log(`Warning: Error looking up name of property: ${e.message}`);
      }
      symbolName = "unknown";
    }

    // Capture unused identifier
    const filepath = allReferences[0].path;
    unusedIdentifiers.push({
      type,
      filepath,
      lineNumber,
      label: symbolName,
      relativePath: filepath.replace(projectRoot, ""),
    });
  } else {
    // Copy allReferences and remove first reference (always the file where the symbol is first declared)
    const refs: TrackedReference[] = [...allReferences];
    const ogReference = refs.shift();

    // Create set of unique references
    const uniqueReferences: TrackedReference[] = [
      ...new Set(refs.map((r) => r.path)),
    ].map((p) => {
      return allReferences.find((r) => r.path === p);
    });

    // Filter uniqueReferences to ONLY include values that are NOT matches in referenceIgnorePatterns
    const validReferences = uniqueReferences.filter((r) => {
      // Make sure r is defined before trying to access its properties
      if (!r) return false;
      
      // Check if the reference path matches any of the ignore patterns
      return !referenceIgnorePatterns.some((ip) => {
        // Make sure the ignore pattern is not empty
        if (!ip) return false;
        return r.path.includes(ip);
      });
    });

    // If there are no VALID references, mark the symbol as unused
    if (validReferences.length === 0) {
      try {
        lineNumber = symbol.getStartLineNumber();
        symbolName = getSymbolName(symbol);
      } catch (e) {
        if (logLevel === LogLevels.verbose) {
          console.log(`Error looking up symbol information: ${e.message}`);
        }
        symbolName = "unknown";
        lineNumber = 0;
      }

      // Capture unused identifier
      unusedIdentifiers.push({
        type,
        filepath: ogReference.path,
        lineNumber,
        label: symbolName,
        relativePath: ogReference.path.replace(projectRoot, ""),
      });
    }
  }

  return unusedIdentifiers;
}
