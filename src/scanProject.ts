import { Project, ScriptTarget, SourceFile } from "ts-morph";
import { UnreferencedSymbol, LogLevel, LogLevels } from "./types";
import { scanFile } from "./scanFile";

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
    tsConfigFilePath,
    ignorePatterns = [],
    referenceIgnorePatterns = [],
    logLevel,
  } = props;

  // FEATURE - integrate loading spinner here
  if (logLevel !== LogLevels.none) {
    console.log("Loading project...");
  }

  // Instantiates new ts-morph project
  const project = new Project({
    tsConfigFilePath,
    compilerOptions: {
      target: ScriptTarget.ES3,
    },
  });

  // Collects array of source files
  const sourceFiles: SourceFile[] = project.getSourceFiles();

  // FEATURE - integrate loading spinner here
  if (logLevel !== LogLevels.none) {
    console.log("Loaded project.");
    console.log("Starting scan.");
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

  // Return array of unused symbols
  return allUnused;
}
