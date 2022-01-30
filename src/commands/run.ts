import { writeFileSync } from "fs";
import chalk from "chalk";
import * as path from "path";
import { OutputFormat, OutputFormats, LogLevel, LogLevels } from "../types";
import { scanProject } from "../scanProject";
import { getOutput } from "../getOutput";
import { prettify } from "../prettify";
import { printToStdout } from "../printToStdout";

// // // //

/**
 * Main program function
 */
function main(props: {
  projectRoot: string;
  tsConfigFile: string;
  ignorePatterns: string[];
  referenceIgnorePatterns: string[];
  outputFormat?: OutputFormat;
  outputDestination?: string;
  logLevel: LogLevel;
}): void {
  const {
    logLevel,
    projectRoot,
    tsConfigFile = "tsconfig.json",
    ignorePatterns = [],
    referenceIgnorePatterns = [],
    outputFormat = OutputFormats.txt,
    outputDestination = null,
  } = props;

  // FEATURE - this should be decoupled from main ->
  // just have a separate function that accpets the output and writes it.
  const allUnused = scanProject({
    projectRoot,
    tsConfigFilePath: path.resolve(projectRoot, tsConfigFile),
    ignorePatterns,
    referenceIgnorePatterns,
    logLevel,
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

  // Get formatted output
  const output = getOutput({
    allUnused,
    outputFormat,
  });

  // Write output to outputDestination
  if (outputDestination !== null) {
    writeFileSync(
      path.resolve(process.cwd(), outputDestination),
      prettify({ source: output.join("\n"), outputFormat })
    );
    return;
  }

  // Print output to stdout
  printToStdout(output);
}

// // // //

/**
 * Runs the `main` script from the command line
 */
export const runCommand = (opts: {
  output: "txt" | "json" | "markdown";
  destination: string | undefined;
  projectPath: string;
  ignorePatterns: string[];
  referenceIgnorePatterns: string[];
  logLevel: LogLevel;
}) => {
  main({
    projectRoot: process.cwd(),
    tsConfigFile: "tsconfig.json",
    outputFormat: opts.output,
    outputDestination: opts.destination,
    ignorePatterns: opts.ignorePatterns,
    referenceIgnorePatterns: opts.referenceIgnorePatterns,
    logLevel: opts.logLevel,
  });
};
