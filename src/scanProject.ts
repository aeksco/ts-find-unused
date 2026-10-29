import { Project, ScriptTarget, SourceFile } from "ts-morph";
import {
  Depth,
  LogLevel,
  LogLevels,
  ScanResult,
  ScannedFile,
  SymbolRecord,
} from "./types";
import { scanFile } from "./scanFile";
import { createReferenceClassifier } from "./references";
import { propagate } from "./propagate";
import { describeSummary } from "./getOutput";
import { existsSync } from "fs";
import * as path from "path";
// Import ora using require to avoid TypeScript type issues
const ora = require("ora");

// Define a type for the spinner to ensure type checking
type Spinner = {
  start: (text?: string) => Spinner;
  stop: () => Spinner;
  succeed: (text?: string) => Spinner;
  fail: (text?: string) => Spinner;
  warn: (text?: string) => Spinner;
  info: (text?: string) => Spinner;
  text: string;
};

// // // //
// Check ALL files

export function scanProject(props: {
  projectRoot: string;
  tsConfigFilePath: string;
  ignorePatterns: string[];
  referenceIgnorePatterns: string[];
  referenceIgnoreRegex: string[];
  logLevel: LogLevel;
  checkEnumMembers?: boolean;
  depth?: Depth;
  reexportsAreUsages?: boolean;
}): ScanResult {
  const {
    projectRoot,
    ignorePatterns = [],
    referenceIgnorePatterns = [],
    referenceIgnoreRegex = [],
    logLevel,
    checkEnumMembers = true,
    depth = 1,
    reexportsAreUsages = false,
  } = props;

  // Make a mutable copy of the tsConfigFilePath
  let tsConfigFilePath = props.tsConfigFilePath;

  // Initialize spinner
  const spinner: Spinner = ora();

  // Start loading spinner
  if (logLevel !== LogLevels.none) {
    spinner.start("Loading project...");
  }

  // Check if tsconfig.json exists
  if (!existsSync(tsConfigFilePath)) {
    spinner.fail(`Error: tsconfig.json not found at ${tsConfigFilePath}`);

    // Try different paths
    const possiblePaths = [
      path.join(projectRoot, 'tsconfig.json'),
      path.join(process.cwd(), 'tsconfig.json'),
      'tsconfig.json'
    ];

    let found = false;
    for (const possiblePath of possiblePaths) {
      if (existsSync(possiblePath)) {
        spinner.info(`Found tsconfig.json at ${possiblePath}, using that instead.`);
        tsConfigFilePath = possiblePath;
        found = true;
        break;
      }
    }

    if (!found) {
      spinner.fail(`Could not find tsconfig.json in any of these locations: ${possiblePaths.join(', ')}`);
      spinner.info(`Project root: ${projectRoot}`);
      spinner.info(`Current directory: ${process.cwd()}`);
      process.exit(1);
    }
  }

  // Instantiates new ts-morph project
  let project;
  try {
    project = new Project({
      tsConfigFilePath,
      compilerOptions: {
        target: ScriptTarget.ES3,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    spinner.fail(`Error loading project: ${message}`);
    process.exit(1);
  }

  // Collects array of source files
  const sourceFiles: SourceFile[] = project.getSourceFiles();

  // Update spinner text
  if (logLevel !== LogLevels.none) {
    spinner.succeed("Project loaded successfully");
    spinner.start("Scanning for unused code...");

    // Log options if in verbose mode
    if (logLevel === LogLevels.verbose) {
      spinner.stop();
      console.log("Ignore patterns:", ignorePatterns);
      console.log("Reference ignore patterns:", referenceIgnorePatterns);
      console.log("Reference ignore regex:", referenceIgnoreRegex);
      console.log("Depth:", depth);
      console.log("Re-exports are usages:", reexportsAreUsages);
      spinner.start("Scanning for unused code...");
    }
  }

  // The classifier compiles the ignore patterns once and is shared by every file
  const classifier = createReferenceClassifier({
    referenceIgnorePatterns,
    referenceIgnoreRegex,
    reexportsAreUsages,
    logLevel,
  });

  // Collect one record per declaration (plus per-file facts) across the whole project
  const records: SymbolRecord[] = [];
  const files: ScannedFile[] = [];
  const ownerAliases = new Map<string, string[]>();
  sourceFiles.forEach((sourceFile) => {
    // Skip sourceFiles where filepath includes one of the ignore patterns
    const filePath = sourceFile.getFilePath();
    if (ignorePatterns.some((ip) => filePath.includes(ip))) {
      return;
    }

    const scanned = scanFile({
      sourceFile,
      projectRoot,
      logLevel,
      classifier,
      checkEnumMembers,
    });
    for (const record of scanned.records) records.push(record);
    scanned.ownerAliases.forEach((keys, declarationKey) => ownerAliases.set(declarationKey, keys));
    files.push(scanned.file);
  });

  if (logLevel !== LogLevels.none) {
    spinner.succeed(`Scanned ${records.length} symbols in ${files.length} files`);
    spinner.start(
      depth === 1
        ? "Resolving unused symbols..."
        : `Resolving transitive dead code (depth: ${depth})...`
    );
  }

  // Walk the reference graph to decide what is dead
  const result = propagate({ records, files, depth, ownerAliases });

  // Stop spinner
  if (logLevel !== LogLevels.none) {
    spinner.succeed(`Scan complete. ${describeSummary(result.summary)}.`);
  }

  return result;
}
