import * as path from "path";
import { scanProject } from "../scanProject";
import { getOutput } from "../getOutput";
import {
  LogLevels,
  OutputFormats,
  ScanResult,
  SymbolTypes,
  UnreferencedSymbol,
} from "../types";

describe("ts-find-unused", () => {
  describe("Core Functionality", () => {
    test("scanProject returns unused symbols with the expected shape", () => {
      const projectRoot = path.resolve(__dirname, "../../");
      const tsConfigFilePath = path.resolve(projectRoot, "tsconfig.json");

      const result = scanProject({
        projectRoot,
        tsConfigFilePath,
        ignorePatterns: ["node_modules", "dist", "__tests__"],
        referenceIgnorePatterns: [],
        referenceIgnoreRegex: [],
        logLevel: LogLevels.none,
        checkEnumMembers: true,
      });

      expect(Array.isArray(result.unused)).toBe(true);
      expect(result.unused.every((r) => r.filepath && r.type && r.label)).toBe(true);
      // The default depth only reports direct findings
      expect(result.unused.every((r) => r.depth === 1 && r.cycle === undefined)).toBe(true);
      expect(result.summary.total).toBe(result.unused.length);
      expect(Array.isArray(result.removableFiles)).toBe(true);
    });

    test("scanProject handles ignore patterns correctly", () => {
      const projectRoot = path.resolve(__dirname, "../../");
      const tsConfigFilePath = path.resolve(projectRoot, "tsconfig.json");

      const resultsWithIgnore = scanProject({
        projectRoot,
        tsConfigFilePath,
        ignorePatterns: ["src/example/**"],
        referenceIgnorePatterns: [],
        referenceIgnoreRegex: [],
        logLevel: LogLevels.none,
        checkEnumMembers: false,
      });

      const resultsWithoutIgnore = scanProject({
        projectRoot,
        tsConfigFilePath,
        ignorePatterns: [],
        referenceIgnorePatterns: [],
        referenceIgnoreRegex: [],
        logLevel: LogLevels.none,
        checkEnumMembers: false,
      });

      // Results with ignore should have fewer or equal items than without
      expect(resultsWithIgnore.unused.length).toBeLessThanOrEqual(
        resultsWithoutIgnore.unused.length
      );
    });
  });

  describe("Output Formatting", () => {
    const mockSymbols: UnreferencedSymbol[] = [
      {
        type: SymbolTypes.interface,
        filepath: "/test/file.ts",
        relativePath: "/test/file.ts",
        lineNumber: 10,
        label: "UnusedInterface",
        depth: 1,
        unusedAfter: [],
        clusterId: 1,
      },
      {
        type: SymbolTypes.class,
        filepath: "/test/another.ts",
        relativePath: "/test/another.ts",
        lineNumber: 20,
        label: "UnusedClass",
        depth: 1,
        unusedAfter: [],
        clusterId: 2,
      },
    ];
    const mockResult: ScanResult = {
      unused: mockSymbols,
      removableFiles: [],
      summary: { total: 2, direct: 2, transitive: 0, cycles: 0, depthReached: 1 },
    };
    const emptyResult: ScanResult = {
      unused: [],
      removableFiles: [],
      summary: { total: 0, direct: 0, transitive: 0, cycles: 0, depthReached: 0 },
    };

    test("getOutput generates txt format correctly", () => {
      const output = getOutput({
        result: mockResult,
        outputFormat: OutputFormats.txt,
      });

      expect(Array.isArray(output)).toBe(true);
      expect(output.length).toBeGreaterThan(0);
      expect(output.some(line => line.includes("UnusedInterface"))).toBe(true);
      expect(output.some(line => line.includes("UnusedClass"))).toBe(true);
    });

    test("getOutput generates markdown format correctly", () => {
      const output = getOutput({
        result: mockResult,
        outputFormat: OutputFormats.markdown,
      });

      expect(Array.isArray(output)).toBe(true);
      expect(output.some(line => line.includes("|"))).toBe(true); // Markdown table
      expect(output.some(line => line.includes("UnusedInterface"))).toBe(true);
    });

    test("getOutput generates json format correctly", () => {
      const output = getOutput({
        result: mockResult,
        outputFormat: OutputFormats.json,
      });

      expect(Array.isArray(output)).toBe(true);
      const jsonString = output.join("\n");
      expect(() => JSON.parse(jsonString)).not.toThrow();

      const parsed = JSON.parse(jsonString);
      expect(Array.isArray(parsed.unused)).toBe(true);
      expect(parsed.unused.length).toBe(2);
      expect(parsed.summary.total).toBe(2);
    });

    test("getOutput handles empty unused symbols", () => {
      const output = getOutput({
        result: emptyResult,
        outputFormat: OutputFormats.txt,
      });

      expect(Array.isArray(output)).toBe(true);
      expect(output.length).toBe(0);
    });
  });

  describe("Path Resolution", () => {
    test("absolute paths work correctly", () => {
      const absolutePath = "/absolute/path/to/tsconfig.json";
      expect(path.isAbsolute(absolutePath)).toBe(true);
    });

    test("relative paths work correctly", () => {
      const relativePath = "./relative/path/to/tsconfig.json";
      expect(path.isAbsolute(relativePath)).toBe(false);
    });
  });

  describe("TypeScript Strict Mode", () => {
    test("strict mode is enabled", () => {
      const tsconfig = require("../../tsconfig.build.json");
      expect(tsconfig.compilerOptions.strict).toBe(true);
    });
  });
});
