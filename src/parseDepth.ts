import { Depth, MAX_DEPTH } from "./types";

/**
 * parseDepth
 * Accepts a positive integer (as a number or a numeric string) or "max".
 * Returns undefined for anything else so the caller can report the bad value.
 */
export function parseDepth(value: unknown): Depth | undefined {
  let candidate = value;
  if (typeof candidate === "string") {
    const trimmed = candidate.trim().toLowerCase();
    if (trimmed === MAX_DEPTH) {
      return MAX_DEPTH;
    }
    if (!/^\d+$/.test(trimmed)) {
      return undefined;
    }
    candidate = Number(trimmed);
  }
  if (typeof candidate === "number" && Number.isInteger(candidate) && candidate >= 1) {
    return candidate;
  }
  return undefined;
}
