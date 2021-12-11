import {
  ClassDeclaration,
  EnumDeclaration,
  FunctionDeclaration,
  InterfaceDeclaration,
  ReferencedSymbol,
  SourceFile,
  TypeAliasDeclaration,
  VariableDeclaration,
} from "ts-morph";
import {
  SymbolType,
  SymbolTypes,
  UnreferencedSymbol,
  LogLevel,
  LogLevels,
} from "./types";

// // // //

/**
 * findUnusedIdentifiers
 * Finds all references for a type alias
 * @param symbol
 * @returns UnusedIdentifier[]
 */
function findUnusedIdentifiers(props: {
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
    refs.shift();

    // Create set of unique references
    const uniqueReferences = [...new Set(refs)];

    // TODO - remove notes here
    // console.log(symbolNm)
    // console.log(symbolNm)
    // console.log(allReferences)
    // console.log(uniqueReferences)
    // console.log(validReferences)
    // console.log(referenceIgnorePatterns)

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
      const filepath = allReferences[0];
      unusedIdentifiers.push({
        type,
        filepath,
        lineNumber,
        label: symbolName,
        relativePath: filepath.replace(projectRoot, ""),
      });
    }
  }

  return unusedIdentifiers;
}

// // // //

export function scanFile(props: {
  sourceFile: SourceFile;
  projectRoot: string;
  logLevel: LogLevel;
  referenceIgnorePatterns: string[];
}): UnreferencedSymbol[] {
  const { sourceFile, projectRoot, logLevel, referenceIgnorePatterns } = props;
  const classes: ClassDeclaration[] = sourceFile.getClasses();
  const interfaces: InterfaceDeclaration[] = sourceFile.getInterfaces();
  const typeAliases: TypeAliasDeclaration[] = sourceFile.getTypeAliases();
  const enums: EnumDeclaration[] = sourceFile.getEnums();
  const functions: FunctionDeclaration[] = sourceFile.getFunctions();
  const variables: VariableDeclaration[] = sourceFile.getVariableDeclarations();

  // TODO - annotate this
  if (logLevel === LogLevels.verbose) {
    console.log("Checking ", sourceFile.getFilePath());
    console.log("interfaces", interfaces.length);
    console.log("classes", classes.length);
    console.log("typeAliases", typeAliases.length);
    console.log("enums", enums.length);
    console.log("functions", functions.length);
    console.log("variables", variables.length);
    console.log("\n");
  }

  let unusedIdentifiers: UnreferencedSymbol[] = [];

  // Find unused type aliases
  typeAliases.forEach((symbol: TypeAliasDeclaration) => {
    unusedIdentifiers = [
      ...unusedIdentifiers,
      ...findUnusedIdentifiers({
        symbol,
        logLevel,
        projectRoot,
        referenceIgnorePatterns,
        type: SymbolTypes.typeAlias,
      }),
    ];
  });

  // Find unused functions
  functions.forEach((symbol: FunctionDeclaration) => {
    unusedIdentifiers = [
      ...unusedIdentifiers,
      ...findUnusedIdentifiers({
        symbol,
        logLevel,
        projectRoot,
        referenceIgnorePatterns,
        type: SymbolTypes.function,
      }),
    ];
  });

  // Find unused classes
  classes.forEach((symbol: ClassDeclaration) => {
    unusedIdentifiers = [
      ...unusedIdentifiers,
      ...findUnusedIdentifiers({
        symbol,
        logLevel,
        projectRoot,
        referenceIgnorePatterns,
        type: SymbolTypes.class,
      }),
    ];
  });

  // Find unused enums
  enums.forEach((symbol: EnumDeclaration) => {
    unusedIdentifiers = [
      ...unusedIdentifiers,
      ...findUnusedIdentifiers({
        symbol,
        logLevel,
        projectRoot,
        referenceIgnorePatterns,
        type: SymbolTypes.enum,
      }),
    ];
  });

  // Find unused variables
  variables.forEach((symbol: VariableDeclaration) => {
    unusedIdentifiers = [
      ...unusedIdentifiers,
      ...findUnusedIdentifiers({
        symbol,
        logLevel,
        projectRoot,
        referenceIgnorePatterns,
        type: SymbolTypes.variable,
      }),
    ];
  });

  // Find unused interfaces
  interfaces.forEach((symbol: InterfaceDeclaration) => {
    try {
      unusedIdentifiers = [
        ...unusedIdentifiers,
        ...findUnusedIdentifiers({
          symbol,
          logLevel,
          projectRoot,
          referenceIgnorePatterns,
          type: SymbolTypes.interface,
        }),
      ];
    } catch (e) {
      // TODO - wrap in logLevel?
      console.log("Warning: interface lookup err");
    }
  });

  return unusedIdentifiers;
}
