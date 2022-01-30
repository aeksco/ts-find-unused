// When using "--ignore-patterns example" -> this is NOT found.
export const unusedExport = "foobar";

export const exportUsedOnlyInTestFile = "foobar";

export enum UnusedEnum {
  foo = "foo",
  bar = "bar",
}

// This is an unused export
export { UnusedExportFromModule } from "./source";

// Unused locals
const foo = "1234";
const bar = "1234";
