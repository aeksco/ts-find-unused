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
  const references: ReferencedSymbol[] = symbol.findReferences();
  // const references: ReferencedSymbol[] = project.getLanguageService().findReferences(symbol)

  // TODO - annotate
  if (logLevel === LogLevels.verbose) {
    // @ts-ignore
    console.log(symbol.getNodeProperty("name")._compilerNode.escapedText);
  }

  // Log detailed output of each reference
  let allReferences = [];
  for (const ref of references) {
    for (const r of ref.getReferences()) {
      // console.log(r);
      allReferences.push(r.getSourceFile().getFilePath());

      if (logLevel === LogLevels.verbose) {
        console.log(r.getSourceFile().getFilePath());
      }
    }
  }

  if (logLevel !== LogLevels.none) {
    console.log(`Find references: ${allReferences.length}`);
  }

  let unusedIdentifiers: UnreferencedSymbol[] = [];

  let symbolName = "";
  let lineNumber = -1;

  if (allReferences.length === 0) {
    console.log("SOMETHING IS WRONG WITH THIS FILE");
    return [];
  }

  if (allReferences.length === 1) {
    try {
      lineNumber = symbol.getStartLineNumber();
      symbolName =
        // @ts-ignore
        symbol.getNodeProperty("name")._compilerNode.escapedText;
    } catch (e) {
      console.log("err");
    }

    // Capture unused identifier
    const filepath = allReferences[0];
    unusedIdentifiers.push({
      type,
      filepath,
      lineNumber,
      label: symbolName,
      relativePath: filepath.replace(projectRoot, ""),
    });
  } else {
    // Copy allReferences and remove first reference (always the file where the symbol is first declared)
    const refs = [...allReferences];
    const ogReference = refs.shift();

    // Create set of unique references
    const uniqueReferences = [...new Set(refs)];

    // TODO - remove debug statements here
    // console.log(allReferences);
    // console.log(ogReference);
    // console.log(uniqueReferences);
    // console.log(validReferences)
    // console.log(referenceIgnorePatterns);

    // Filter uniqueReferences to ONLY include values that are NOT matches in referenceIgnorePatterns
    const validReferences = uniqueReferences.filter((r) => {
      return !referenceIgnorePatterns.some((ip) => r.includes(ip));
    });

    // If there are no VALID references, mark the symbol as unused
    if (validReferences.length === 0) {
      try {
        lineNumber = symbol.getStartLineNumber();
        symbolName =
          // @ts-ignore
          symbol.getNodeProperty("name")._compilerNode.escapedText;
      } catch (e) {
        console.log("err");
      }

      // Capture unused identifier
      unusedIdentifiers.push({
        type,
        filepath: ogReference,
        lineNumber,
        label: symbolName,
        relativePath: ogReference.replace(projectRoot, ""),
      });
    }
  }

  return unusedIdentifiers;
}
