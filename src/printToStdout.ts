import chalk from "chalk";

/**
 * printToStdout
 * Helper function to print each line to stdout with colorful formatting
 * @param lines - array of lines being printed to stdout
 */
export function printToStdout(lines: string[]): void {
  console.log("\n");
  
  if (lines.length === 0) {
    console.log(chalk.green("No unused code found!"));
    return;
  }
  
  console.log(chalk.yellow(`Found ${lines.length} unused symbols:`));
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
    
    // Highlight the file path
    const pathMatch = line.match(/->(.+)$/);
    if (pathMatch) {
      line = line.replace(pathMatch[0], `-> ${chalk.gray(pathMatch[1])}`);
    }
    
    console.log(line);
  });
  
  console.log(chalk.gray("----------------------------------------"));
  console.log("\n");
}
