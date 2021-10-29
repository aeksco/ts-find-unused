export function printToStdout(lines: string[]): void {
  console.log("\n");
  lines.forEach(line => {
    console.log(line);
  });
  console.log("\n");
}
