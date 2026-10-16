import {
  COLORS,
  STAGES,
  clone,
  evaluate,
  findRuns,
  availableMoves,
  type Game,
} from "./engine";
export const SAVE_KEY = "bonbon-borough:campaign:v1";
export interface Save {
  version: 1;
  unlocked: number;
  game: Game;
  sound: boolean;
}
const integer = (n: unknown, min = 0, max = 1e9): n is number =>
  typeof n === "number" && Number.isInteger(n) && n >= min && n <= max;
export function decodeSave(raw: string | null): Save | null {
  try {
    if (!raw) return null;
    const s: Save = JSON.parse(raw),
      g = s.game;
    if (
      s.version !== 1 ||
      !integer(s.unlocked, 0, 5) ||
      typeof s.sound !== "boolean" ||
      !g ||
      !integer(g.level, 0, s.unlocked) ||
      !integer(g.moves, 0, STAGES[g.level].moves) ||
      !integer(g.seed, 1, 4294967295) ||
      !integer(g.nextId, 1) ||
      !integer(g.score) ||
      !integer(g.glaze) ||
      !integer(g.blocks) ||
      !integer(g.specials) ||
      !COLORS.every((c) => integer(g.collected?.[c])) ||
      !["playing", "won", "lost"].includes(g.status) ||
      !Array.isArray(g.board) ||
      g.board.length !== 64
    )
      return null;
    const ids = new Set<number>();
    for (const c of g.board) {
      if (
        !integer(c.block, 0, 2) ||
        !integer(c.glaze, 0, 2) ||
        !!c.block === !!c.sweet
      )
        return null;
      if (c.sweet) {
        if (
          !COLORS.includes(c.sweet.color) ||
          !integer(c.sweet.id, 1, g.nextId - 1) ||
          ids.has(c.sweet.id) ||
          (c.sweet.special &&
            !["row", "column", "parcel", "prism"].includes(c.sweet.special))
        )
          return null;
        ids.add(c.sweet.id);
      }
    }
    const expected = clone(g);
    evaluate(expected);
    if (
      expected.status !== g.status ||
      findRuns(g.board).length ||
      (g.status === "playing" && !availableMoves(g).length)
    )
      return null;
    return s;
  } catch {
    return null;
  }
}
export function encodeSave(s: Save): string {
  return JSON.stringify(s);
}
export function readSave(): Save | null {
  try {
    return decodeSave(localStorage.getItem(SAVE_KEY));
  } catch {
    return null;
  }
}
export function writeSave(s: Save): boolean {
  try {
    localStorage.setItem(SAVE_KEY, encodeSave(s));
    return true;
  } catch {
    return false;
  }
}
