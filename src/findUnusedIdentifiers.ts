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

interface ReferenceObj {
  path: string;
  isDefinition: boolean;
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
  // @ts-ignore
  const references: ReferencedSymbol[] = symbol.findReferences();
  // const references: ReferencedSymbol[] = project.getLanguageService().findReferences(symbol)

  // TODO - annotate
  if (logLevel === LogLevels.verbose) {
    console.log("- - - - - - - - - - - - - - - - - - - -");
    console.log("findUnusedIdentifiers:");
    console.log(`type: ${type}`);
    // @ts-ignore
    console.log(symbol.getNodeProperty("name")._compilerNode.escapedText);
    console.log("- - - - - - - - - - - - - - - - - - - -");
  }

  // Log detailed output of each reference
  let allReferences: ReferenceObj[] = [];
  for (const ref of references) {
    for (const r of ref.getReferences()) {
      // TODO - annotate
      if (logLevel === LogLevels.verbose) {
        console.log("Each reference:");
        console.log(r);
      }

      // ORIG
      allReferences.push({
        path: r.getSourceFile().getFilePath(),
        // @ts-ignore
        isDefinition: r._compilerObject.isDefinition,
      });

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

  // TODO - annotate
  if (allReferences.length === 0) {
    // TODO - clean up this error message
    console.log("SOMETHING IS WRONG WITH THIS FILE");
    return [];
  }

  // Make a filtered array of references that are *not* the definition
  // References with the `isDefinition` flag include exports and the original definition
  const nonDefinitionReferences = allReferences.filter(
    (r) => r.isDefinition === false
  );

  if (allReferences.length === 1 || nonDefinitionReferences.length === 0) {
    try {
      lineNumber = symbol.getStartLineNumber();
      symbolName =
        // @ts-ignore
        symbol.getNodeProperty("name")._compilerNode.escapedText;
    } catch (e) {
      // TODO - improve error message here
      console.log("err");
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
    const refs: ReferenceObj[] = [...allReferences];
    const ogReference = refs.shift();

    // Create set of unique references
    const uniqueReferences: ReferenceObj[] = [
      ...new Set(refs.map((r) => r.path)),
    ].map((p) => {
      return allReferences.find((r) => r.path === p);
    });

    // TODO - remove debug statements here
    // console.log(allReferences);
    // console.log(ogReference);
    // console.log(uniqueReferences);
    // console.log(validReferences)
    // console.log(referenceIgnorePatterns);

    // Filter uniqueReferences to ONLY include values that are NOT matches in referenceIgnorePatterns
    const validReferences = uniqueReferences.filter((r) => {
      return !referenceIgnorePatterns.some((ip) => r.path.includes(ip));
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
        filepath: ogReference.path,
        lineNumber,
        label: symbolName,
        relativePath: ogReference.path.replace(projectRoot, ""),
      });
    }
  }

  return unusedIdentifiers;
}
