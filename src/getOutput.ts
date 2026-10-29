import {
  OutputFormat,
  OutputFormats,
  RemovableFile,
  ScanResult,
  ScanSummary,
  SymbolRef,
  UnreferencedSymbol,
} from "./types";

// // // //

/**
 * describeSummary
 * One-line description of the headline numbers, shared by every output format
 */
export function describeSummary(summary: ScanSummary): string {
  const { total, direct, transitive, cycles, depthReached } = summary;
  const parts = [`${direct} direct`];
  if (transitive > 0) parts.push(`${transitive} transitive`);
  if (cycles > 0) parts.push(`${cycles} in dead cycles`);
  const depthNote = depthReached > 1 ? `, max depth ${depthReached}` : "";
  const noun = total === 1 ? "symbol" : "symbols";
  return `Found ${total} unused ${noun} (${parts.join(", ")}${depthNote})`;
}

/**
 * depthLabel
 * How a depth is shown in tables: a number, or "cycle" for members of a dead cycle
 */
function depthLabel(entry: { depth?: number; cycle?: boolean }): string {
  if (entry.cycle) return "cycle";
  return entry.depth === undefined ? "-" : String(entry.depth);
}

/**
 * inlineCode
 * Inline code that survives backticks in the text, with pipes escaped so the
 * table cell does not split
 */
function inlineCode(text: string): string {
  const runs = text.match(/`+/g) ?? [];
  const longestRun = runs.reduce((longest, run) => Math.max(longest, run.length), 0);
  const fence = "`".repeat(longestRun + 1);
  const padded = longestRun > 0 ? ` ${text} ` : text;
  return `${fence}${padded}${fence}`.replace(/\|/g, "\\|");
}

function markdownFileLink(relativePath: string, lineNumber?: number): string {
  const target = lineNumber === undefined ? `.${relativePath}` : `.${relativePath}#L${lineNumber}`;
  return `[\`.${relativePath}\`](${target})`;
}

function markdownRefs(refs: SymbolRef[] | undefined): string {
  if (refs === undefined || refs.length === 0) return "-";
  return refs
    .map((ref) => `[${inlineCode(ref.label)}](.${ref.relativePath}#L${ref.lineNumber})`)
    .join(", ");
}

/**
 * generateMarkdownOutput
 * Generate output as Markdown
 */
export function generateMarkdownOutput(result: ScanResult): string[] {
  const { unused, removableFiles, summary } = result;
  const markdownOutput: string[] = [];

  markdownOutput.push(`**${describeSummary(summary)}**`);
  markdownOutput.push("");

  if (removableFiles.length > 0) {
    markdownOutput.push("## Removable files");
    markdownOutput.push("");
    markdownOutput.push(
      "Every declaration in these files is unused and nothing else in them would be lost."
    );
    markdownOutput.push("");
    markdownOutput.push("| # | File | Symbols | Depth |");
    markdownOutput.push("| - | ---- | ------- | ----- |");
    removableFiles.forEach((file: RemovableFile, index: number) => {
      markdownOutput.push(
        `| ${index + 1} | ${markdownFileLink(file.relativePath)} | ${file.symbolCount} | ${depthLabel(file)} |`
      );
    });
    markdownOutput.push("");
  }

  markdownOutput.push("## Unused symbols");
  markdownOutput.push("");
  markdownOutput.push("| # | Symbol | Type | Filepath | Line | Depth | Unused after removing |");
  markdownOutput.push("| - | ------ | ---- | -------- | ---- | ----- | --------------------- |");

  // Add each row to markdown table
  unused.forEach((uid: UnreferencedSymbol, index: number) => {
    const line = uid.lineNumber;
    const link = markdownFileLink(uid.relativePath, line);
    const { label, type } = uid;
    markdownOutput.push(
      `| ${index + 1} | ${inlineCode(label)} | ${type} | ${link} | ${line} | ${depthLabel(uid)} | ${markdownRefs(uid.unusedAfter)} |`
    );
  });

  return markdownOutput;
}

/**
 * generateJsonOutput
 * Generate output as JSON
 */
export function generateJsonOutput(result: ScanResult): string[] {
  const unused = result.unused.map((uid) => {
    return {
      label: uid.label,
      type: uid.type,
      relativePath: uid.relativePath,
      filepath: uid.filepath,
      lineNumber: uid.lineNumber,
      depth: uid.depth,
      cycle: uid.cycle,
      unusedAfter: uid.unusedAfter ?? [],
      clusterId: uid.clusterId,
    };
  });

  return [
    JSON.stringify(
      { summary: result.summary, unused, removableFiles: result.removableFiles },
      null,
      4
    ),
  ];
}

/**
 * generateTxtOutput
 * Generate formatted .txt output
 */
export function generateTxtOutput(result: ScanResult): string[] {
  const lines = result.unused.map((uid) => {
    const base = `  -  ${uid.label} (${uid.type}) -> ${uid.relativePath}:${uid.lineNumber}`;
    if (uid.depth === 1) return base;
    const after = (uid.unusedAfter ?? []).map((ref) => ref.label).join(", ");
    const level = uid.cycle ? "cycle" : `depth ${uid.depth}`;
    return `${base} [${level}, after: ${after}]`;
  });

  if (result.removableFiles.length > 0) {
    lines.push("");
    lines.push("  Removable files (every declaration unused):");
    result.removableFiles.forEach((file) => {
      const noun = file.symbolCount === 1 ? "symbol" : "symbols";
      const level = file.cycle ? "cycle" : `depth ${file.depth}`;
      lines.push(`  *  ${file.relativePath} (${file.symbolCount} ${noun}, ${level})`);
    });
  }

  return lines;
}

/**
 * getOutput
 * Gets the program output as an array of strings
 */
export function getOutput(props: {
  result: ScanResult;
  outputFormat: OutputFormat;
}): string[] {
  const { outputFormat, result } = props;
  if (outputFormat === OutputFormats.markdown) {
    return generateMarkdownOutput(result);
  } else if (outputFormat === OutputFormats.json) {
    return generateJsonOutput(result);
  }
  return generateTxtOutput(result);
}
