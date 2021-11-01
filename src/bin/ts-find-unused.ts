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

// Logo from: https://patorjk.com/software/taag/#p=display&v=0&f=Basic&t=ts-find-unused
// TODO - add credit to README.md
const logoText = `
d888888b .d8888.        d88888b d888888b d8b   db d8888b.        db    db d8b   db db    db .d8888. d88888b d8888b.
'~~88~~' 88'  YP        88'       '88'   888o  88 88  '8D        88    88 888o  88 88    88 88'  YP 88'     88  '8D
   88    '8bo.          88ooo      88    88V8o 88 88   88        88    88 88V8o 88 88    88 '8bo.   88ooooo 88   88
   88      'Y8b.        88~~~      88    88 V8o88 88   88        88    88 88 V8o88 88    88   'Y8b. 88~~~~~ 88   88
   88    db   8D        88        .88.   88  V888 88  .8D        88b  d88 88  V888 88b  d88 db   8D 88.     88  .8D
   YP    '8888Y'        YP      Y888888P VP   V8P Y8888D'        ~Y8888P' VP   V8P ~Y8888P' '8888Y' Y88888P Y8888D'
`;
program.addHelpText("before", `\n${chalk.cyan(logoText)}\n`);

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

      // // // //
      // TODO - add support for tsconfig.json path
      // TODO - add support for tsconfig.json path
      // TODO - add support for tsconfig.json path
      //
      //    tsconfig.json path:
      //      ts-find-unused /path/to/project --tsconfigPath=/path/to/project/tsconfig-test.json
      //
      // // // //

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
  console.log(
    `\n\tSupport this project at ${chalk.cyan(
      `https://github.com/aeksco/ts-find-unused`
    )}\n`
  );
});

// Parse arguments into commander program
program.parse();
