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
  .argument("<project path>", "path to TypeScript project")
  // .option("-logLevel --l", "Log level - log progress during the scan")
  .option("-d --debug", "Debug flag - log verbose progress during the scan")
  .option(
    "-i --ignorePatterns",
    "Ignore Patters - skip scanning files that match the a glob style pattern "
  )
  .option("-o --output txt|markdown|json", "Scans the project ")
  .option(
    "-d --destination",
    "Optional filepath to write the output instead of logging to stdout "
  )
  .description("run the command ")
  .action((projectPath, opts, cmd) => {
    // console.log(projectPath);
    // console.log(cmd);
    // console.log(opts);
    // const options = cleanArgs(cmd);
    // console.log(options);

    // TODO - pass options into runCommand
    runCommand();
  });

// output help information on unknown commands
// program.arguments("<command>").action(cmd => {
//   program.outputHelp();
//   console.log(`  ` + chalk.red(`Unknown command ${chalk.yellow(cmd)}.`));
//   console.log();
// });

// add some useful info on help
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
program.parse(process.argv);

// Output --help if there are no arguments passed
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
