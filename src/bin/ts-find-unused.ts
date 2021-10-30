#!/usr/bin/env node

// Check node version before requiring/doing anything else
// The user may be on a very old node version
// import minimist from "minimist";
import { Command } from "commander";
import chalk from "chalk";
import { runCommand } from "../commands/run";
import { LogLevels, LogLevel } from "../types";
const packageJson = require("../../package.json");

// // // //
// Setup CLI with Commander
const program = new Command();

// // // //
//
//    tsconfig.json path:
//      ts-find-unused /path/to/project --tsconfigPath=/path/to/project/tsconfig-test.json
//
// // // //

// Setup `plugin-run` command
program
  .version(String(packageJson.version))
  .option(
    "-p --project-path <tsconfigFile>",
    "Optional filepath to write the output instead of logging to stdout"
  )
  .option(
    "-i --ignore-patterns <ignorePatterns>",
    "Ignore Patters - skip scanning files that match the a glob style pattern"
  )
  .option(
    "-o --output <output>",
    "Output - choose output format txt|markdown|json (default: txt)"
  )
  .option(
    "-d --destination <destination>",
    "Optional filepath to write the output instead of logging to stdout"
  )
  .option(
    "-l --logLevel <logLevel>",
    "Log Level - choose level of program logs none|info|verbose (default: none)"
  )
  .option("--debug", "Debug - debug CLI options")
  .description("Run the ts-find-unused program")
  .action(
    (opts: {
      output?: "markdown" | "txt" | "json";
      destination?: string;
      debug?: boolean;
      projectPath?: string;
      logLevel?: LogLevel;
      ignorePatterns?: string;
    }) => {
      const {
        output = "txt",
        logLevel = LogLevels.none,
        destination = undefined,
        debug = false,
        projectPath = "./tsconfig.json",
        ignorePatterns = ""
      } = opts;

      // Short-circuit execution if "output" option isn't valid
      if (["markdown", "json", "txt"].indexOf(output) === -1) {
        console.log(`"${output}" is not a valid option for --outputFormat`);
        process.exit(0);
      }

      // Split ignorePatterns text into array + remove empty strings
      const ignorePatternsArray: string[] = ignorePatterns
        .split(",")
        .filter(i => i !== "");

      // Log out options if debug is "true"
      if (debug) {
        console.log("Debug CLI options:");
        console.log(opts);
      }

      // Pass parameters to `runCommand` to run the program
      runCommand({
        output,
        destination,
        projectPath,
        logLevel,
        ignorePatterns: ignorePatternsArray
      });
    }
  );

// Add help command
program.on("--help", () => {
  console.log();
  console.log(
    `  Support this project at ${chalk.cyan(
      `https://github.com/aeksco/ts-find-unused`
    )}\n`
  );
});

// Parse arguments into commander program
program.parse();
