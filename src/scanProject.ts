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

  // TODO - integrate ora spinner here
  if (logLevel !== LogLevels.info) {
    console.log("Loading project...");
  }

  const project = new Project({
    tsConfigFilePath,
    compilerOptions: {
      target: ScriptTarget.ES3,
    },
  });

  const sourceFiles: SourceFile[] = project.getSourceFiles();

  // TODO - integrate ora spinner here
  if (logLevel !== LogLevels.info) {
    console.log("Loaded project.");
    console.log("Starting scan.");
  }

  let allUnused: UnreferencedSymbol[] = [];

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

  return allUnused;
}
