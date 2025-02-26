import { Project, ScriptTarget, SourceFile } from "ts-morph";
import { UnreferencedSymbol, LogLevel, LogLevels } from "./types";
import { scanFile } from "./scanFile";
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
  logLevel: LogLevel;
}): UnreferencedSymbol[] {
  const {
    projectRoot,
    ignorePatterns = [],
    referenceIgnorePatterns = [],
    logLevel,
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
    spinner.fail(`Error loading project: ${error.message}`);
    process.exit(1);
  }

  // Collects array of source files
  const sourceFiles: SourceFile[] = project.getSourceFiles();

  // Update spinner text
  if (logLevel !== LogLevels.none) {
    spinner.succeed("Project loaded successfully");
    spinner.start("Scanning for unused code...");
    
    // Log ignore patterns if in verbose mode
    if (logLevel === LogLevels.verbose) {
      spinner.stop();
      console.log("Ignore patterns:", ignorePatterns);
      console.log("Reference ignore patterns:", referenceIgnorePatterns);
      spinner.start("Scanning for unused code...");
    }
  }

  // Define array to capture all unused symbols in the project
  let allUnused: UnreferencedSymbol[] = [];

  // Iterate over each source file to collect unused symbols
  sourceFiles.forEach((sourceFile) => {
    // Skip sourceFiles where filepath includes one of the ignore patterns
    const filePath = sourceFile.getFilePath();
    if (ignorePatterns.some((ip) => filePath.includes(ip))) {
      return;
    }

    // Collect all unused identifiers
    allUnused = [
      ...allUnused,
      ...scanFile({
        sourceFile,
        projectRoot,
        logLevel,
        referenceIgnorePatterns,
      }),
    ];
  });

  // Stop spinner
  if (logLevel !== LogLevels.none) {
    spinner.succeed(`Scan complete. Found ${allUnused.length} unused symbols.`);
  }

  // Return array of unused symbols
  return allUnused;
}
