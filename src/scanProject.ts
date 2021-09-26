import { Project, ScriptTarget, SourceFile } from "ts-morph";
import { UnreferencedSymbol } from "./types";
import { scanFile } from "./scanFile";

// // // //
// Check ALL files

export function scanProject(props: {
  projectRoot: string;
  tsConfigFilePath: string;
  ignorePatterns: string[];
  log: boolean;
}): UnreferencedSymbol[] {
  const { projectRoot, tsConfigFilePath, ignorePatterns, log = false } = props;

  if (log) {
    console.log("loading project...");
  }

  const project = new Project({
    tsConfigFilePath,
    compilerOptions: {
      target: ScriptTarget.ES3
    }
  });

  const sourceFiles: SourceFile[] = project.getSourceFiles();

  if (log) {
    console.log("loaded project.");
    console.log("starting scan.");
  }

  let allUnused: UnreferencedSymbol[] = [];

  sourceFiles.forEach(sourceFile => {
    // Ignore files in web/web/pages
    // TODO - wire up to ignore patterns
    if (sourceFile.getFilePath().includes("web/web/pages")) {
      return;
    }

    // Collect all unused identifiers
    allUnused = [...allUnused, ...scanFile({ sourceFile, projectRoot, log })];
  });

  return allUnused;
}
