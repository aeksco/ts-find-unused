#!/usr/bin/env node

// Check node version before requiring/doing anything else
// The user may be on a very old node version
// import minimist from "minimist";
import { Command } from "commander";
import chalk from "chalk";
import { runCommand } from "../commands/run";
import { cleanArgs } from "../util/cleanArgs";
const packageJson = require("../../package.json");

// // // //
// Setup CLI with Commander
const program = new Command();

// // // //
//
//    tsconfig.json path:
//      ts-find-unused /path/to/project --tsconfigPath=/path/to/project/tsconfig-test.json
//
//    Output Format
//      ts-find-unused /path/to/project --outputFormat=txt (default)
//      ts-find-unused /path/to/project --outputFormat=markdown
//      ts-find-unused /path/to/project --outputFormat=json
//
//    Output Destination
//      ts-find-unused /path/to/project --outputDestination=./unused.txt
//      ts-find-unused /path/to/project --outputFormat=markdown --outputDestination=./unused.md
//      ts-find-unused /path/to/project --outputFormat=json --outputDestination=./unused.json
//
// // // //

// Setup `plugin-run` command
program
  .version(String(packageJson.version))
  // TODO - is there a way to log output as a SINGLE LINE? Investigate this - I see it a lot, would be cool to display the name of the current file WITHOUT printing a ton of shit to STDOUT
  // TODO - is there a way to log output as a SINGLE LINE? Investigate this - I see it a lot, would be cool to display the name of the current file WITHOUT printing a ton of shit to STDOUT
  // TODO - is there a way to log output as a SINGLE LINE? Investigate this - I see it a lot, would be cool to display the name of the current file WITHOUT printing a ton of shit to STDOUT
  .option("--debug", "Debug - log verbose progress during the scan")
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
  .description("run the command")
  .action(
    (opts: {
      output?: "markdown" | "txt" | "json";
      destination?: string;
      debug?: boolean;
      projectPath?: string;
      ignorePatterns?: string;
    }) => {
      const {
        output = "markdown",
        destination = undefined,
        debug = false,
        projectPath = "./tsconfig.json",
        ignorePatterns = ""
      } = opts;

      // Short-circuit execution if "output" option isn't valid
      // @ts-ignore
      if (!["markdown" | "json" | "txt"].includes(output)) {
        console.log(`"${output}" is not a valid option for -o`);
        process.exit(0);
      }

      const ignorePatternsArray = ignorePatterns.split(",");

      // Log out options if debug is "true"
      if (debug) {
        console.log(opts);
      }

      // Pass parameters to `runCommand`
      runCommand({
        output,
        debug,
        destination,
        projectPath,
        ignorePatterns: ignorePatternsArray
      });
    }
  );

// output help information on unknown commands
// TODO - do we need this?
// program.arguments("<command>").action(cmd => {
//   program.outputHelp();
//   console.log(`  ` + chalk.red(`Unknown command ${chalk.yellow(cmd)}.`));
//   console.log();
// });

// add some useful info on help
// TODO - do we need this?
program.on("--help", () => {
  console.log();
  console.log(
    `  Run ${chalk.cyan(`TODO - add help text here`)} with helpful information.`
  );
  console.log();
});

// Stub-out dedicated help command for each individual command
// program.commands.forEach(c => c.on("--help", () => console.log()));

// Parse arguments into commander program
// program.parse(process.argv);
program.parse();

// Output --help if there are no arguments passed
// if (!process.argv.slice(2).length) {
//   program.outputHelp();
// }
