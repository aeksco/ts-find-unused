export const importedButUnused = 1;

export function rec(n: number): number {
  return n > 0 ? rec(n - 1) : 0;
}

function hidden() {
  return 1;
}
export { hidden };

export class Self {
  static make() {
    return new Self();
  }
}
