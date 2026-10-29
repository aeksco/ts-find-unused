import {
  BindingElement,
  BindingName,
  EnumDeclaration,
  Node,
  ReferenceFindableNode,
  SourceFile,
} from "ts-morph";
import {
  SymbolTypes,
  LogLevel,
  LogLevels,
  ScannedFile,
  SymbolRecord,
  SymbolType,
} from "./types";
import {
  collectSymbolRecord,
  getSymbolName,
  isDirectlyUnused,
} from "./collectSymbolRecord";
import { ReferenceClassifier, TrackedDeclaration, nodeKey } from "./references";

// // // //

/**
 * isDeletableFile
 * A file can only be deleted wholesale when every statement in it is an import, a local
 * export list, or one of the declarations we track. Anything else (module-level code,
 * `export ... from` re-exports, namespaces, `export default <expression>`) would be lost.
 */
function isDeletableFile(sourceFile: SourceFile): boolean {
  for (const statement of sourceFile.getStatements()) {
    if (Node.isImportDeclaration(statement)) {
      continue;
    }
    if (Node.isExportDeclaration(statement)) {
      // `export { x } from "./y"` keeps consumers of ./y working - deleting it would break them
      if (statement.getModuleSpecifier() !== undefined) {
        return false;
      }
      continue;
    }
    if (
      Node.isFunctionDeclaration(statement) ||
      Node.isClassDeclaration(statement) ||
      Node.isInterfaceDeclaration(statement) ||
      Node.isTypeAliasDeclaration(statement) ||
      Node.isEnumDeclaration(statement) ||
      Node.isVariableStatement(statement)
    ) {
      continue;
    }
    return false;
  }
  return true;
}

/**
 * getBindingElements
 * Leaf bindings of a destructuring pattern, nested patterns included:
 * `const { a, b: { c }, ...rest } = obj` yields a, c and rest
 */
function getBindingElements(name: BindingName): BindingElement[] {
  if (!Node.isObjectBindingPattern(name) && !Node.isArrayBindingPattern(name)) {
    return [];
  }
  const leaves: BindingElement[] = [];
  for (const element of name.getElements()) {
    if (Node.isOmittedExpression(element)) continue;
    const elementName = element.getNameNode();
    if (Node.isIdentifier(elementName)) {
      leaves.push(element);
    } else {
      leaves.push(...getBindingElements(elementName));
    }
  }
  return leaves;
}

/**
 * Scan an individual file in the TS project
 */
export function scanFile(props: {
  sourceFile: SourceFile;
  projectRoot: string;
  logLevel: LogLevel;
  classifier: ReferenceClassifier;
  checkEnumMembers?: boolean;
}): {
  records: SymbolRecord[];
  file: ScannedFile;
  /** destructuring declaration key -> keys of its bindings, for references owned by the declaration */
  ownerAliases: Map<string, string[]>;
} {
  const { sourceFile, projectRoot, logLevel, classifier, checkEnumMembers = true } = props;
  const filepath = sourceFile.getFilePath();

  const declarations: Array<{ node: TrackedDeclaration; type: SymbolType }> = [
    ...sourceFile.getTypeAliases().map((node) => ({ node, type: SymbolTypes.typeAlias })),
    ...sourceFile.getFunctions().map((node) => ({ node, type: SymbolTypes.function })),
    ...sourceFile.getClasses().map((node) => ({ node, type: SymbolTypes.class })),
    ...sourceFile.getEnums().map((node) => ({ node, type: SymbolTypes.enum })),
    ...sourceFile.getVariableDeclarations().map((node) => ({ node, type: SymbolTypes.variable })),
    ...sourceFile.getInterfaces().map((node) => ({ node, type: SymbolTypes.interface })),
  ];

  // Log details of scanFile to the console with verbose LogLevel
  if (logLevel === LogLevels.verbose) {
    console.log("- - - - - - - - - - - - - - - - - - - -");
    console.log("Checking ", filepath);
    console.log("declarations", declarations.length);
    console.log("- - - - - - - - - - - - - - - - - - - -");
  }

  // Reference lookup can fail on exotic declarations (broken files, ...) - report and move on
  const tryCollect = (args: {
    node: Node & ReferenceFindableNode;
    label: string;
    type: SymbolType;
    parentKey?: string;
    selfKey?: string;
  }): SymbolRecord | undefined => {
    try {
      return collectSymbolRecord({ ...args, projectRoot, classifier, logLevel });
    } catch (e) {
      if (logLevel === LogLevels.verbose) {
        const message = e instanceof Error ? e.message : String(e);
        console.log(`Warning: could not look up references for ${args.label} in ${filepath}: ${message}`);
      }
      return undefined;
    }
  };

  const records: SymbolRecord[] = [];
  const declarationKeys: string[] = [];
  const ownerAliases = new Map<string, string[]>();
  let unscannedDeclarations = 0;

  for (const { node, type } of declarations) {
    // `const { a, b } = obj` - the pattern itself has no references, so check each binding
    // on its own. References inside the declaration (its initializer) count as self references.
    if (Node.isVariableDeclaration(node) && !Node.isIdentifier(node.getNameNode())) {
      const declarationKey = nodeKey(node);
      const elements = getBindingElements(node.getNameNode());
      const elementKeys: string[] = [];
      let complete = elements.length > 0;
      for (const element of elements) {
        const record = tryCollect({
          node: element,
          label: element.getName(),
          type,
          selfKey: declarationKey,
        });
        if (record === undefined) {
          complete = false;
          continue;
        }
        records.push(record);
        elementKeys.push(record.key);
      }
      declarationKeys.push(...elementKeys);
      if (complete) {
        ownerAliases.set(declarationKey, elementKeys);
      } else {
        unscannedDeclarations++;
      }
      continue;
    }

    const record = tryCollect({ node, label: getSymbolName(node), type });
    if (record === undefined) {
      unscannedDeclarations++;
      continue;
    }
    records.push(record);
    declarationKeys.push(record.key);

    // Only check the members of enums that are used somewhere - members of a dead enum are noise
    if (type === SymbolTypes.enum && checkEnumMembers && !isDirectlyUnused(record)) {
      const enumDeclaration = node as EnumDeclaration;
      const enumName = getSymbolName(enumDeclaration);
      const members = enumDeclaration.getMembers();
      if (logLevel === LogLevels.verbose) {
        console.log(`Checking members of enum ${enumName}, found ${members.length} members`);
      }
      for (const member of members) {
        const memberRecord = tryCollect({
          node: member,
          label: `${enumName}.${member.getName()}`,
          type: SymbolTypes.enum,
          parentKey: record.key,
        });
        if (memberRecord !== undefined) records.push(memberRecord);
      }
    }
  }

  const file: ScannedFile = {
    filepath,
    relativePath: filepath.replace(projectRoot, ""),
    declarationKeys,
    unscannedDeclarations,
    deletable: isDeletableFile(sourceFile),
  };

  return { records, file, ownerAliases };
}
