/**
 * printToStdout
 * Helper function to print each line to stdout
 * @param lines - array of lines being printed to stdout
 */
export function printToStdout(lines: string[]): void {
  console.log("\n");
  lines.forEach(line => {
    console.log(line);
  });
  console.log("\n");
}
