import { writeFileSync } from "fs";
import chalk from "chalk";
import * as path from "path";
import { OutputFormat, OutputFormats, LogLevel, LogLevels } from "../types";
import { scanProject } from "../scanProject";
import { getOutput } from "../getOutput";
import { prettify } from "../prettify";
import { printToStdout } from "../printToStdout";

// // // //

function main(props: {
  projectRoot: string;
  tsConfigFile: string;
  ignorePatterns: string[];
  outputFormat?: OutputFormat;
  outputDestination?: string;
  logLevel: LogLevel;
}): void {
  const {
    logLevel,
    projectRoot,
    tsConfigFile = "tsconfig.json",
    ignorePatterns = [],
    outputFormat = OutputFormats.txt,
    outputDestination = null
  } = props;

  // TODO - this should be decoupled from main ->
  // just have a separate function that accpets the output and writes it.
  const allUnused = scanProject({
    projectRoot,
    tsConfigFilePath: path.resolve(projectRoot, tsConfigFile),
    ignorePatterns,
    logLevel
  });

  // TOOD - annotate
  if (logLevel !== LogLevels.none) {
    console.log("allUnused");
    console.log(allUnused);
  }

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
    outputFormat
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
 * runCommand
 * TODO - annotate
 * TODO - annotate
 * TODO - annotate
 */
export const runCommand = (opts: {
  output: "txt" | "json" | "markdown";
  destination: string | undefined;
  projectPath: string;
  ignorePatterns: string[];
  logLevel: LogLevel;
}) => {
  // TODO - separate main out into separate functions here
  main({
    projectRoot: process.cwd(),
    tsConfigFile: "tsconfig.json",
    outputFormat: opts.output,
    outputDestination: opts.destination,
    ignorePatterns: opts.ignorePatterns,
    logLevel: opts.logLevel
  });
};

// // // //
// // // //
// // // //
// // // //
// // // //

// TODO - remove this - just here for testing this project against...this project
const foo = "1234";
const bar = "1234";
