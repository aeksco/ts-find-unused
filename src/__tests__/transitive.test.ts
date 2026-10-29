import * as path from "path";
import { scanProject } from "../scanProject";
import { describeSummary, getOutput } from "../getOutput";
import { MAX_LABEL_LENGTH, normalizeLabel } from "../collectSymbolRecord";
import { parseDepth } from "../parseDepth";
import { LogLevels, OutputFormats, ScanResult, SymbolTypes } from "../types";

const fixturesRoot = path.resolve(__dirname, "../../fixtures");

type ScanOptions = Parameters<typeof scanProject>[0];

function scan(fixture: string, overrides: Partial<ScanOptions> = {}): ScanResult {
  const projectRoot = path.join(fixturesRoot, fixture);
  return scanProject({
    projectRoot,
    tsConfigFilePath: path.join(projectRoot, "tsconfig.json"),
    ignorePatterns: [],
    referenceIgnorePatterns: [],
    referenceIgnoreRegex: [],
    logLevel: LogLevels.none,
    checkEnumMembers: true,
    ...overrides,
  });
}

/** "label@depth" for every reported symbol, sorted, so expectations read as sets */
function labels(result: ScanResult): string[] {
  return result.unused
    .map((row) => `${row.label}@${row.cycle ? "cycle" : row.depth}`)
    .sort();
}

function after(result: ScanResult, label: string): string[] {
  const row = result.unused.find((candidate) => candidate.label === label);
  if (row === undefined) throw new Error(`${label} was not reported`);
  return (row.unusedAfter ?? []).map((ref) => ref.label);
}

function removable(result: ScanResult): string[] {
  return result.removableFiles.map((file) => file.relativePath);
}

describe("transitive dead code", () => {
  describe("chain fixture (fnB -> fnA -> fnD)", () => {
    test("depth 1 reports only symbols with no references at all", () => {
      const result = scan("chain", { depth: 1 });
      expect(labels(result)).toEqual(["EnumA.b@1", "fnB@1"]);
      expect(result.summary).toEqual({
        total: 2,
        direct: 2,
        transitive: 0,
        cycles: 0,
        depthReached: 1,
      });
      expect(removable(result)).toEqual([]);
      // Two unrelated findings land in two clusters
      expect(new Set(result.unused.map((row) => row.clusterId)).size).toBe(2);
    });

    test("depth 2 adds everything only fnB used, and folds the dead enum's members into the enum", () => {
      const result = scan("chain", { depth: 2 });
      expect(labels(result)).toEqual(
        ["fnB@1", "fnA@2", "TypeA@2", "EnumA@2", "helper@2"].sort()
      );
      expect(after(result, "fnA")).toEqual(["fnB"]);
      expect(after(result, "helper")).toEqual(["fnB"]);
      expect(after(result, "TypeA")).toEqual(["fnB"]);
      expect(after(result, "EnumA")).toEqual(["fnB"]);
      expect(after(result, "fnB")).toEqual([]);
    });

    test("depth 3 reaches the end of the chain and max stops there", () => {
      const expected = ["fnB@1", "fnA@2", "TypeA@2", "EnumA@2", "helper@2", "fnD@3"].sort();
      const atThree = scan("chain", { depth: 3 });
      const atMax = scan("chain", { depth: "max" });
      expect(labels(atThree)).toEqual(expected);
      expect(labels(atMax)).toEqual(expected);
      expect(after(atMax, "fnD")).toEqual(["fnA"]);
      expect(atMax.summary).toEqual({
        total: 6,
        direct: 1,
        transitive: 5,
        cycles: 0,
        depthReached: 3,
      });
    });

    test("rows come out shallow first and share one cluster", () => {
      const result = scan("chain", { depth: "max" });
      const depths = result.unused.map((row) => row.depth);
      expect(depths).toEqual([...depths].sort((a, b) => (a ?? 0) - (b ?? 0)));
      expect(result.unused[0].label).toBe("fnB");
      expect(new Set(result.unused.map((row) => row.clusterId))).toEqual(new Set([1]));
    });

    test("files whose every declaration is dead are listed as removable", () => {
      const result = scan("chain", { depth: "max" });
      expect(removable(result)).toEqual(["/file-b.ts", "/file-d.ts"]);
      expect(result.removableFiles.map((file) => file.depth)).toEqual([2, 3]);
      expect(result.removableFiles.map((file) => file.symbolCount)).toEqual([2, 1]);
    });

    test("live code stays out of the report at every depth", () => {
      const result = scan("chain", { depth: "max" });
      expect(result.unused.map((row) => row.label)).not.toContain("live");
    });

    test("enum member checking can still be switched off", () => {
      const result = scan("chain", { depth: 1, checkEnumMembers: false });
      expect(labels(result)).toEqual(["fnB@1"]);
    });
  });

  describe("cycle fixture", () => {
    test("numeric depths never report a dead cycle", () => {
      expect(labels(scan("cycle", { depth: 5 }))).toEqual([]);
    });

    test("max reports the cycle and what hangs off it, but not a cycle reachable from live code", () => {
      const result = scan("cycle", { depth: "max" });
      expect(labels(result)).toEqual(["x@cycle", "y@cycle", "z@cycle"]);
      expect(after(result, "x")).toEqual(["y"]);
      expect(after(result, "y")).toEqual(["x"]);
      expect(after(result, "z")).toEqual(["x"]);
      expect(result.unused.every((row) => row.depth === undefined)).toBe(true);
      expect(result.summary).toEqual({
        total: 3,
        direct: 0,
        transitive: 0,
        cycles: 3,
        depthReached: 0,
      });
      expect(removable(result)).toEqual(["/x.ts", "/y.ts", "/z.ts"]);
      expect(result.removableFiles.every((file) => file.cycle === true)).toBe(true);
    });
  });

  describe("barrel fixture", () => {
    test("a re-export alone does not keep a symbol alive, but a consumer through the barrel does", () => {
      const result = scan("barrel");
      expect(labels(result)).toEqual(["onlyReexported@1"]);
      expect(removable(result)).toEqual([]);
    });

    test("reexportsAreUsages restores the old behaviour", () => {
      expect(labels(scan("barrel", { reexportsAreUsages: true }))).toEqual([]);
    });

    test("ignoreUsagesIn still drops references by file", () => {
      const result = scan("barrel", { referenceIgnorePatterns: ["consumer"] });
      expect(labels(result)).toEqual(["onlyReexported@1", "viaBarrel@1"]);
    });
  });

  describe("direct fixture", () => {
    test("imports, self references and local export lists do not count as usages", () => {
      const result = scan("direct");
      expect(labels(result)).toEqual(["Self@1", "hidden@1", "importedButUnused@1", "rec@1"]);
      const types = Object.fromEntries(result.unused.map((row) => [row.label, row.type]));
      expect(types).toEqual({
        Self: SymbolTypes.class,
        hidden: SymbolTypes.function,
        importedButUnused: SymbolTypes.variable,
        rec: SymbolTypes.function,
      });
      expect(removable(result)).toEqual(["/lib.ts"]);
      expect(result.removableFiles[0]).toMatchObject({ symbolCount: 4, depth: 1 });
    });
  });

  describe("excluded fixture", () => {
    test("a declaration in an excluded file keeps whatever it references alive", () => {
      const result = scan("excluded", { depth: "max", ignorePatterns: ["/entry/"] });
      expect(labels(result)).toEqual(["orphan@1"]);
      expect(removable(result)).toEqual(["/orphan.ts"]);
    });

    test("without the exclusion the entry point cascades", () => {
      const result = scan("excluded", { depth: "max" });
      expect(labels(result)).toEqual(["Comp@2", "Page@1", "orphan@1"]);
      expect(after(result, "Comp")).toEqual(["Page"]);
      expect(removable(result)).toEqual(["/entry/page.ts", "/orphan.ts", "/comp.ts"]);
    });
  });

  describe("destructure fixture", () => {
    test("each binding of a destructuring declaration is checked on its own", () => {
      const result = scan("destructure", { depth: 1 });
      expect(labels(result)).toEqual(
        ["deep@1", "first@1", "onlyFedToDeadBinding@1", "syncUserPreferences@1", "syncUserProfile@1"].sort()
      );
      expect(result.unused.every((row) => !/\s/.test(row.label))).toBe(true);
      expect(removable(result)).toEqual([]);
    });

    test("code only feeding a dead binding is reported at the next depth", () => {
      const result = scan("destructure", { depth: "max" });
      expect(labels(result)).toContain("feed@2");
      expect(after(result, "feed")).toEqual(["onlyFedToDeadBinding"]);
    });
  });

  describe("removable fixture", () => {
    test("only files with nothing but dead declarations qualify", () => {
      const result = scan("removable", { depth: "max" });
      expect(labels(result)).toEqual(["deadA@1", "deadB@1", "deadC@1", "deadD@1"]);
      expect(removable(result)).toEqual(["/dead-file.ts"]);
    });
  });
});

describe("normalizeLabel", () => {
  test("collapses whitespace onto one line", () => {
    expect(normalizeLabel("{\n  syncUserProfile,\n  syncUserName,\n}")).toBe(
      "{ syncUserProfile, syncUserName, }"
    );
    expect(normalizeLabel("plain")).toBe("plain");
  });

  test("truncates long labels with an ellipsis", () => {
    const long = "x".repeat(MAX_LABEL_LENGTH * 2);
    const label = normalizeLabel(long);
    expect(label).toHaveLength(MAX_LABEL_LENGTH);
    expect(label.endsWith("...")).toBe(true);
    expect(normalizeLabel("y".repeat(MAX_LABEL_LENGTH))).toHaveLength(MAX_LABEL_LENGTH);
  });
});

describe("parseDepth", () => {
  test("accepts positive integers and max", () => {
    expect(parseDepth("1")).toBe(1);
    expect(parseDepth("12")).toBe(12);
    expect(parseDepth(3)).toBe(3);
    expect(parseDepth("max")).toBe("max");
    expect(parseDepth(" MAX ")).toBe("max");
  });

  test("rejects everything else", () => {
    expect(parseDepth("0")).toBeUndefined();
    expect(parseDepth(0)).toBeUndefined();
    expect(parseDepth("-1")).toBeUndefined();
    expect(parseDepth(2.5)).toBeUndefined();
    expect(parseDepth("deep")).toBeUndefined();
    expect(parseDepth("")).toBeUndefined();
    expect(parseDepth(undefined)).toBeUndefined();
    expect(parseDepth(null)).toBeUndefined();
  });
});

describe("output formats with transitive results", () => {
  const sample: ScanResult = {
    unused: [
      {
        label: "fnB",
        type: SymbolTypes.function,
        filepath: "/p/src/file-b.ts",
        relativePath: "/src/file-b.ts",
        lineNumber: 2,
        depth: 1,
        unusedAfter: [],
        clusterId: 1,
      },
      {
        label: "fnA",
        type: SymbolTypes.function,
        filepath: "/p/src/file-a.ts",
        relativePath: "/src/file-a.ts",
        lineNumber: 5,
        depth: 2,
        unusedAfter: [{ label: "fnB", relativePath: "/src/file-b.ts", lineNumber: 2 }],
        clusterId: 1,
      },
      {
        label: "loop",
        type: SymbolTypes.function,
        filepath: "/p/src/loop.ts",
        relativePath: "/src/loop.ts",
        lineNumber: 1,
        cycle: true,
        unusedAfter: [{ label: "loop2", relativePath: "/src/loop.ts", lineNumber: 4 }],
        clusterId: 2,
      },
    ],
    removableFiles: [
      { filepath: "/p/src/file-b.ts", relativePath: "/src/file-b.ts", symbolCount: 1, depth: 1 },
    ],
    summary: { total: 3, direct: 1, transitive: 1, cycles: 1, depthReached: 2 },
  };

  test("describeSummary reads naturally", () => {
    expect(describeSummary(sample.summary)).toBe(
      "Found 3 unused symbols (1 direct, 1 transitive, 1 in dead cycles, max depth 2)"
    );
    expect(
      describeSummary({ total: 1, direct: 1, transitive: 0, cycles: 0, depthReached: 1 })
    ).toBe("Found 1 unused symbol (1 direct)");
  });

  test("markdown has a summary, a removable files section and the new columns", () => {
    const output = getOutput({ result: sample, outputFormat: OutputFormats.markdown });
    expect(output[0]).toBe(
      "**Found 3 unused symbols (1 direct, 1 transitive, 1 in dead cycles, max depth 2)**"
    );
    expect(output).toContain("## Removable files");
    expect(output).toContain("| 1 | [`./src/file-b.ts`](./src/file-b.ts) | 1 | 1 |");
    expect(output).toContain(
      "| # | Symbol | Type | Filepath | Line | Depth | Unused after removing |"
    );
    const fnARow = output.find((line) => line.includes("`fnA`"));
    expect(fnARow).toContain("| 2 | [`fnB`](./src/file-b.ts#L2) |");
    const fnBRow = output.find((line) => line.includes("`fnB`") && line.includes("| function |"));
    expect(fnBRow).toContain("| 1 | - |");
    const loopRow = output.find((line) => line.includes("`loop`"));
    expect(loopRow).toContain("| cycle | [`loop2`](./src/loop.ts#L4) |");
  });

  test("markdown escapes pipes and backticks inside symbol cells", () => {
    const awkward: ScanResult = {
      ...sample,
      unused: [
        { ...sample.unused[0], label: "a|b" },
        {
          ...sample.unused[1],
          label: "x`y",
          unusedAfter: [{ label: "c|d", relativePath: "/src/file-b.ts", lineNumber: 2 }],
        },
      ],
    };
    const output = getOutput({ result: awkward, outputFormat: OutputFormats.markdown });
    expect(output.some((line) => line.includes("| `a\\|b` |"))).toBe(true);
    expect(output.some((line) => line.includes("| `` x`y `` |"))).toBe(true);
    expect(output.some((line) => line.includes("[`c\\|d`](./src/file-b.ts#L2)"))).toBe(true);
  });

  test("json is an object with summary, unused and removableFiles", () => {
    const parsed = JSON.parse(
      getOutput({ result: sample, outputFormat: OutputFormats.json }).join("\n")
    );
    expect(parsed.summary).toEqual(sample.summary);
    expect(parsed.unused).toHaveLength(3);
    expect(parsed.unused[0]).not.toHaveProperty("cycle");
    expect(parsed.unused[1].unusedAfter[0].label).toBe("fnB");
    expect(parsed.unused[1].clusterId).toBe(1);
    expect(parsed.unused[2].cycle).toBe(true);
    expect(parsed.unused[2]).not.toHaveProperty("depth");
    expect(parsed.removableFiles).toEqual(sample.removableFiles);
  });

  test("txt appends a note to transitive rows and lists removable files", () => {
    const output = getOutput({ result: sample, outputFormat: OutputFormats.txt });
    expect(output[0]).toBe("  -  fnB (function) -> /src/file-b.ts:2");
    expect(output[1]).toBe("  -  fnA (function) -> /src/file-a.ts:5 [depth 2, after: fnB]");
    expect(output[2]).toBe("  -  loop (function) -> /src/loop.ts:1 [cycle, after: loop2]");
    expect(output).toContain("  Removable files (every declaration unused):");
    expect(output).toContain("  *  /src/file-b.ts (1 symbol, depth 1)");
  });
});
