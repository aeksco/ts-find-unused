import {
  ClassDeclaration,
  EnumDeclaration,
  FunctionDeclaration,
  InterfaceDeclaration,
  SourceFile,
  TypeAliasDeclaration,
  VariableDeclaration,
} from "ts-morph";
import { SymbolTypes, UnreferencedSymbol, LogLevel, LogLevels } from "./types";
import { findUnusedIdentifiers } from "./findUnusedIdentifiers";

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
    console.log("- - - - - - - - - - - - - - - - - - - -");
    console.log("Checking ", sourceFile.getFilePath());
    console.log("interfaces", interfaces.length);
    console.log("classes", classes.length);
    console.log("typeAliases", typeAliases.length);
    console.log("enums", enums.length);
    console.log("functions", functions.length);
    console.log("variables", variables.length);
    console.log("\n");
    console.log("- - - - - - - - - - - - - - - - - - - -");
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
