import { format } from "prettier";
import { OutputFormat, OutputFormats } from "./types";

// // // //

/**
 * prettify
 * Prettify output with Prettier
 */
export function prettify(params: {
  source: string;
  outputFormat: OutputFormat;
}): string {
  const { source, outputFormat } = params;
  if (outputFormat === OutputFormats.json) {
    return format(source, { parser: "json" });
  } else if (outputFormat === OutputFormats.markdown) {
    return format(source, { parser: "markdown" });
  }
  return source;
}
