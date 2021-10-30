import { UnreferencedSymbol, OutputFormat, OutputFormats } from "./types";

// // // //

/**
 * generateMarkdownOutput
 * Generate output as Markdown
 */
export function generateMarkdownOutput(
  identifiers: UnreferencedSymbol[]
): string[] {
  // Add markdown table header
  let markdownOutput = [];
  markdownOutput.push("| # | Symbol | Type | Filepath | Line |");
  markdownOutput.push("| - | ------ | ---- | -------- | ---- |");

  // Add each row to markdown table
  identifiers.forEach((uid, index) => {
    const link = `[\`${uid.relativePath}\`](${uid.filepath})`;
    const line = uid.lineNumber;
    const { label, type } = uid;
    markdownOutput.push(
      `| ${index + 1} | \`${label}\` | ${type} | ${link} | ${line} |`
    );
  });

  return markdownOutput;
}

/**
 * generateJsonOutput
 * Generate output as JSON
 */
export function generateJsonOutput(
  identifiers: UnreferencedSymbol[]
): string[] {
  // Add json table header
  let jsonOutput = [];

  // Add a JSON object for each
  jsonOutput = identifiers.map(uid => {
    return {
      label: uid.label,
      type: uid.type,
      relativePath: uid.relativePath,
      filepath: uid.filepath,
      lineNumber: uid.lineNumber
    };
  });

  return [JSON.stringify(jsonOutput, null, 4)];
}

/**
 * generateTxtOutput
 * Generate formatted .txt output
 */
export function generateTxtOutput(identifiers: UnreferencedSymbol[]): string[] {
  return identifiers.map(uid => {
    return `  -  ${uid.label} (${uid.type}) -> ${uid.relativePath}:${uid.lineNumber}`;
  });
}

/**
 * getOutput
 * Gets the program output as an array of strings
 */
export function getOutput(props: {
  allUnused: UnreferencedSymbol[];
  outputFormat: OutputFormat;
}): string[] {
  const { outputFormat, allUnused } = props;
  if (outputFormat === OutputFormats.markdown) {
    return generateMarkdownOutput(allUnused);
  } else if (outputFormat === OutputFormats.json) {
    return generateJsonOutput(allUnused);
  }
  return generateTxtOutput(allUnused);
}
