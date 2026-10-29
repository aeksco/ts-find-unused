import chalk from "chalk";
import { ScanResult } from "./types";
import { describeSummary } from "./getOutput";

/**
 * printToStdout
 * Helper function to print each line to stdout with colorful formatting
 * @param lines - array of lines being printed to stdout
 * @param result - the scan result the lines were generated from
 */
export function printToStdout(lines: string[], result: ScanResult): void {
  console.log("\n");

  if (result.unused.length === 0) {
    console.log(chalk.green("No unused code found!"));
    return;
  }

  console.log(chalk.yellow(`${describeSummary(result.summary)}:`));
  console.log(chalk.gray("----------------------------------------"));

  lines.forEach(line => {
    // Add colors to different parts of the output
    if (line.includes("(interface)")) {
      line = line.replace("(interface)", chalk.blue("(interface)"));
    } else if (line.includes("(class)")) {
      line = line.replace("(class)", chalk.magenta("(class)"));
    } else if (line.includes("(enum)")) {
      line = line.replace("(enum)", chalk.cyan("(enum)"));
    } else if (line.includes("(function)")) {
      line = line.replace("(function)", chalk.green("(function)"));
    } else if (line.includes("(type-alias)")) {
      line = line.replace("(type-alias)", chalk.yellow("(type-alias)"));
    } else if (line.includes("(variable)")) {
      line = line.replace("(variable)", chalk.red("(variable)"));
    }

    // Highlight the file path, and dim the transitive note that may follow it
    line = line.replace(
      /-> (\S+)(.*)$/,
      (_match, filePath: string, note: string) => `-> ${chalk.gray(filePath)}${chalk.cyan(note)}`
    );

    // Section header for removable files
    if (line.startsWith("  Removable files")) {
      line = chalk.yellow(line);
    }

    console.log(line);
  });

  console.log(chalk.gray("----------------------------------------"));
  console.log("\n");
}
