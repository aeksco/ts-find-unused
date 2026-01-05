import { writeFileSync } from "fs";
import chalk from "chalk";
import * as path from "path";
import { OutputFormat, OutputFormats, LogLevel, LogLevels, UnreferencedSymbol } from "../types";
import { scanProject } from "../scanProject";
import { getOutput } from "../getOutput";
import { prettify } from "../prettify";
import { printToStdout } from "../printToStdout";

// // // //

/**
 * Write output to file or stdout
 */
function writeOutput(props: {
  allUnused: UnreferencedSymbol[];
  outputFormat: OutputFormat;
  outputDestination: string | undefined;
}): void {
  const { allUnused, outputFormat, outputDestination } = props;

  // Get formatted output
  const output = getOutput({
    allUnused,
    outputFormat,
  });

  // Write output to outputDestination
  if (outputDestination !== undefined) {
    writeFileSync(
      path.resolve(process.cwd(), outputDestination),
      prettify({ source: output.join("\n"), outputFormat })
    );
  } else {
    // Print output to stdout
    printToStdout(output);
  }
}

/**
 * Main program function
 */
function main(props: {
  projectRoot: string;
  tsConfigFile: string;
  ignorePatterns: string[];
  referenceIgnorePatterns: string[];
  referenceIgnoreRegex?: string[];
  outputFormat?: OutputFormat;
  outputDestination?: string;
  logLevel: LogLevel;
  failOnFound?: boolean;
  checkEnumMembers?: boolean;
}): void {
  const {
    logLevel,
    projectRoot,
    tsConfigFile,
    ignorePatterns = [],
    referenceIgnorePatterns = [],
    referenceIgnoreRegex = [],
    outputFormat = OutputFormats.txt,
    outputDestination = undefined,
    failOnFound = false,
    checkEnumMembers = true,
  } = props;

  const allUnused = scanProject({
    projectRoot,
    tsConfigFilePath: path.isAbsolute(tsConfigFile)
      ? tsConfigFile
      : path.resolve(projectRoot, tsConfigFile),
    ignorePatterns,
    referenceIgnorePatterns,
    referenceIgnoreRegex,
    logLevel,
    checkEnumMembers,
  });

  // Log no-unused-code-found message
  if (allUnused.length === 0) {
    console.log(
      `${chalk.cyan(
        "No unused code found :)"
      )} thank you for using ts-find-unused`
    );
    return;
  }

  // Write output to file or stdout
  writeOutput({
    allUnused,
    outputFormat,
    outputDestination,
  });
  
  // Exit with error code if failOnFound is true
  if (failOnFound) {
    console.log(chalk.yellow(`Exiting with error code 1 because unused code was found and --fail-on-found option was set.`));
    process.exit(1);
  }
}

// // // //

/**
 * Runs the `main` script from the command line
 */
export const runCommand = (opts: {
  output: "txt" | "json" | "markdown";
  destination: string | undefined;
  projectPath: string;
  tsconfigPath: string;
  ignorePatterns: string[];
  referenceIgnorePatterns: string[];
  referenceIgnoreRegex: string[];
  logLevel: LogLevel;
  failOnFound?: boolean;
  checkEnumMembers?: boolean;
}) => {
  // Resolve the project root path
  const projectRoot = path.resolve(process.cwd(), opts.projectPath);
  
  // Use the tsconfig path as is - don't try to resolve it relative to the project root
  const tsConfigFile = opts.tsconfigPath;
  
  main({
    projectRoot,
    tsConfigFile,
    outputFormat: opts.output,
    outputDestination: opts.destination,
    ignorePatterns: opts.ignorePatterns,
    referenceIgnorePatterns: opts.referenceIgnorePatterns,
    referenceIgnoreRegex: opts.referenceIgnoreRegex,
    logLevel: opts.logLevel,
    failOnFound: opts.failOnFound,
    checkEnumMembers: opts.checkEnumMembers,
  });
};
