// When using "--ignore-patterns example" -> this is NOT found.
export const unusedExport = "foobar";

export const exportUsedOnlyInTestFile = "foobar";

export enum UnusedEnum {
  foo = "foo",
  bar = "bar",
}
