import { writeFileSync } from "fs";
import chalk from "chalk";
import * as path from "path";
import { OutputFormat, OutputFormats } from "../types";
import { scanProject } from "../scanProject";
import { getOutput } from "../getOutput";
import { printToStdout } from "../printToStdout";

// // // //
// Main code here

export function main(props: {
  projectRoot: string;
  tsConfigFile: string;
  ignorePatterns?: string[];
  outputFormat?: OutputFormat;
  outputDestination?: string;
  log?: boolean;
}): void {
  const {
    projectRoot,
    tsConfigFile = "tsconfig.json",
    ignorePatterns = [],
    outputFormat = OutputFormats.txt,
    outputDestination = null,
    log = false
  } = props;

  // TODO - this should be decoupled from main ->
  // just have a separate function that accpets the output and writes it.
  const allUnused = scanProject({
    projectRoot,
    tsConfigFilePath: path.resolve(projectRoot, tsConfigFile),
    ignorePatterns,
    log // TODO - log should be a function
    // TODO - add props.logLevel
    // TODO - add props.debug
  });

  // Log no-unused-code-found message
  if (allUnused.length === 0) {
    console.log(
      `${chalk.cyan(
        "No unused code found :)"
      )} thank you for using ts-find-unused`
    );
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
      output.join("\n")
    );
    return;
  }

  // Print output to stdout
  printToStdout(output);
}

// // // //

export const runCommand = (...args) => {
  // TODO - separate main out into separate functions here
  main({
    projectRoot: "/home/aeksco/code/ts-find-unused",
    tsConfigFile: "tsconfig.json",
    // outputFormat: "json",
    // outputDestination: "./output.json",
    log: false
  });
};

const foo = "1234";
