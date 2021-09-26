import {
  ClassDeclaration,
  EnumDeclaration,
  FunctionDeclaration,
  InterfaceDeclaration,
  ReferencedSymbol,
  SourceFile,
  TypeAliasDeclaration,
  VariableDeclaration
} from "ts-morph";
import { SymbolType, SymbolTypes, UnreferencedSymbol } from "./types";

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
  log?: boolean;
}): UnreferencedSymbol[] {
  const { symbol, projectRoot, type, log = false } = props;
  const references: ReferencedSymbol[] = symbol.findReferences();
  // const references: ReferencedSymbol[] = project.getLanguageService().findReferences(symbol)

  if (log) {
    // @ts-ignore
    console.log(symbol.getNodeProperty("name")._compilerNode.escapedText);
  }

  // Log detailed output of each reference
  let allReferences = [];
  for (const ref of references) {
    for (const r of ref.getReferences()) {
      // console.log(r);
      allReferences.push(r.getSourceFile().getFilePath());

      if (log) {
        console.log(r.getSourceFile().getFilePath());
      }
    }
  }

  if (log) {
    console.log(`find references: ${allReferences.length}`);
  }

  let unusedIdentifiers: UnreferencedSymbol[] = [];

  if (allReferences.length === 1) {
    let symbolName = "";
    let lineNumber = -1;
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
      relativePath: filepath.replace(projectRoot, "")
    });
  }

  return unusedIdentifiers;
}

// // // //

export function scanFile(props: {
  sourceFile: SourceFile;
  projectRoot: string;
  log?: boolean;
}): UnreferencedSymbol[] {
  const { sourceFile, projectRoot, log = false } = props;
  const classes: ClassDeclaration[] = sourceFile.getClasses();
  const interfaces: InterfaceDeclaration[] = sourceFile.getInterfaces();
  const typeAliases: TypeAliasDeclaration[] = sourceFile.getTypeAliases();
  const enums: EnumDeclaration[] = sourceFile.getEnums();
  const functions: FunctionDeclaration[] = sourceFile.getFunctions();
  const variables: VariableDeclaration[] = sourceFile.getVariableDeclarations();

  if (log) {
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
        projectRoot,
        type: SymbolTypes.typeAlias
      })
    ];
  });

  // Find unused functions
  functions.forEach((symbol: FunctionDeclaration) => {
    unusedIdentifiers = [
      ...unusedIdentifiers,
      ...findUnusedIdentifiers({
        symbol,
        projectRoot,
        type: SymbolTypes.function
      })
    ];
  });

  // Find unused classes
  classes.forEach((symbol: ClassDeclaration) => {
    unusedIdentifiers = [
      ...unusedIdentifiers,
      ...findUnusedIdentifiers({
        symbol,
        projectRoot,
        type: SymbolTypes.class
      })
    ];
  });

  // Find unused enums
  enums.forEach((symbol: EnumDeclaration) => {
    unusedIdentifiers = [
      ...unusedIdentifiers,
      ...findUnusedIdentifiers({ symbol, projectRoot, type: SymbolTypes.enum })
    ];
  });

  // Find unused variables
  variables.forEach((symbol: VariableDeclaration) => {
    unusedIdentifiers = [
      ...unusedIdentifiers,
      ...findUnusedIdentifiers({
        symbol,
        projectRoot,
        type: SymbolTypes.variable
      })
    ];
  });

  // Find unused interfaces
  interfaces.forEach((symbol: InterfaceDeclaration) => {
    try {
      unusedIdentifiers = [
        ...unusedIdentifiers,
        ...findUnusedIdentifiers({
          symbol,
          projectRoot,
          type: SymbolTypes.interface
        })
      ];
    } catch (e) {
      console.log("Warning: interface lookup err");
    }
  });

  return unusedIdentifiers;
}
