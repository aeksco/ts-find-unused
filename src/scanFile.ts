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

/**
 * Find unused enum members
 */
function findUnusedEnumMembers(props: {
  enumDeclaration: EnumDeclaration;
  projectRoot: string;
  logLevel: LogLevel;
  referenceIgnorePatterns: string[];
  referenceIgnoreRegex: string[];
}): UnreferencedSymbol[] {
  const { enumDeclaration, projectRoot, logLevel, referenceIgnorePatterns, referenceIgnoreRegex } = props;
  const enumName = enumDeclaration.getName();
  const filePath = enumDeclaration.getSourceFile().getFilePath();
  const relativePath = filePath.replace(projectRoot, "");
  const unusedMembers: UnreferencedSymbol[] = [];

  // Get all members of the enum
  const enumMembers = enumDeclaration.getMembers();
  
  if (logLevel === LogLevels.verbose) {
    console.log(`Checking members of enum ${enumName}, found ${enumMembers.length} members`);
  }

  // Check each enum member
  enumMembers.forEach(member => {
    const memberName = member.getName();
    const qualifiedName = `${enumName}.${memberName}`;
    
    // Find all references to this enum member
    const references = member.findReferences();
    let allReferences = [];
    
    for (const ref of references) {
      for (const r of ref.getReferences()) {
        allReferences.push({
          path: r.getSourceFile().getFilePath(),
          isDefinition: r.compilerObject.isDefinition,
        });
      }
    }
    
    // Make a filtered array of references that are *not* the definition
    const nonDefinitionReferences = allReferences.filter(r => r.isDefinition === false);
    
    if (logLevel === LogLevels.verbose) {
      console.log(`Enum member ${qualifiedName}: ${nonDefinitionReferences.length} references`);
    }
    
    // Check if the enum member is unused
    if (allReferences.length === 0 || nonDefinitionReferences.length === 0) {
      unusedMembers.push({
        type: SymbolTypes.enum,
        filepath: filePath,
        relativePath,
        lineNumber: member.getStartLineNumber(),
        label: qualifiedName, // Using the full qualified name: EnumName.keyName
      });
    } else {
      // Filter out references that match ignore patterns
      const validReferences = nonDefinitionReferences.filter(r => {
        if (!r) return false;
        
        // Check against ignore patterns
        const matchesPattern = referenceIgnorePatterns.some(ip => {
          if (!ip) return false;
          return r.path.includes(ip);
        });
        
        // Check against regex patterns
        const matchesRegex = referenceIgnoreRegex.some(pattern => {
          if (!pattern) return false;
          try {
            const regex = new RegExp(pattern);
            return regex.test(r.path);
          } catch (e) {
            if (logLevel === LogLevels.verbose) {
              const message = e instanceof Error ? e.message : String(e);
              console.log(`Invalid regex pattern: ${pattern}. Error: ${message}`);
            }
            return false;
          }
        });
        
        return !matchesPattern && !matchesRegex;
      });
      
      // If there are no valid references, mark as unused
      if (validReferences.length === 0) {
        unusedMembers.push({
          type: SymbolTypes.enum,
          filepath: filePath,
          relativePath,
          lineNumber: member.getStartLineNumber(),
          label: qualifiedName,
        });
      }
    }
  });
  
  return unusedMembers;
}

/**
 * Scan an individual file in the TS project
 */
export function scanFile(props: {
  sourceFile: SourceFile;
  projectRoot: string;
  logLevel: LogLevel;
  referenceIgnorePatterns: string[];
  referenceIgnoreRegex: string[];
  checkEnumMembers?: boolean;
}): UnreferencedSymbol[] {
  const { 
    sourceFile, 
    projectRoot, 
    logLevel, 
    referenceIgnorePatterns, 
    referenceIgnoreRegex,
    checkEnumMembers = true
  } = props;
  const classes: ClassDeclaration[] = sourceFile.getClasses();
  const interfaces: InterfaceDeclaration[] = sourceFile.getInterfaces();
  const typeAliases: TypeAliasDeclaration[] = sourceFile.getTypeAliases();
  const enums: EnumDeclaration[] = sourceFile.getEnums();
  const functions: FunctionDeclaration[] = sourceFile.getFunctions();
  const variables: VariableDeclaration[] = sourceFile.getVariableDeclarations();

  // Lots details of scanFile to the console with verbose LogLevel
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

  // Defines array of unused identifiers within the file
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
        referenceIgnoreRegex,
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
        referenceIgnoreRegex,
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
        referenceIgnoreRegex,
        type: SymbolTypes.class,
      }),
    ];
  });

  // Find unused enums
  enums.forEach((symbol: EnumDeclaration) => {
    // Find unused enum declarations
    const unusedEnum = findUnusedIdentifiers({
      symbol,
      logLevel,
      projectRoot,
      referenceIgnorePatterns,
      referenceIgnoreRegex,
      type: SymbolTypes.enum,
    });

    // If the entire enum is unused, add it and skip member checking
    if (unusedEnum.length > 0) {
      unusedIdentifiers = [
        ...unusedIdentifiers,
        ...unusedEnum,
      ];
    } else if (checkEnumMembers) {
      // Only check members if the enum itself is used
      unusedIdentifiers = [
        ...unusedIdentifiers,
        ...findUnusedEnumMembers({
          enumDeclaration: symbol,
          projectRoot,
          logLevel,
          referenceIgnorePatterns,
          referenceIgnoreRegex,
        }),
      ];
    }
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
        referenceIgnoreRegex,
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
          referenceIgnoreRegex,
          type: SymbolTypes.interface,
        }),
      ];
    } catch (e) {
      // Log interface lookup error
      if (logLevel === LogLevels.verbose) {
        console.log("Warning: interface lookup err");
      }
    }
  });

  // Return all unused identifiers for this file
  return unusedIdentifiers;
}
