import { fnA, TypeA, EnumA } from "./file-a";

const helper = (n: number) => n * 2;

export function fnB(arg: TypeA) {
  return helper(fnA()) + EnumA.a.length + arg.x;
}
