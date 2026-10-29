import { fnD } from "./file-d";

export function fnA() {
  return fnD() + 1;
}

export type TypeA = { x: number };

export enum EnumA {
  a = "a",
  b = "b",
}

export function live() {
  return "live";
}
