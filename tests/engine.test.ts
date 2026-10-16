import { describe, expect, it } from "vitest";
import {
  adjacent,
  attemptSwap,
  availableMoves,
  clone,
  COLORS,
  createGame,
  ensureMoves,
  evaluate,
  findRuns,
  objectiveProgress,
  STAGES,
  type Game,
  type Special,
} from "../src/engine";

function board(): Game {
  const g = createGame();
  g.board = Array.from({ length: 64 }, (_, i) => ({
    sweet: { color: COLORS[(Math.floor(i / 8) + 2 * (i % 8)) % 5], id: i + 1 },
    glaze: 0,
    block: 0,
  }));
  g.nextId = 65;
  g.seed = 123456;
  return g;
}
function color(g: Game, ids: number[], value = COLORS[0]): void {
  for (const i of ids) g.board[i].sweet!.color = value;
}
function line(length: number): Game {
  const g = board();
  const cells = Array.from({ length }, (_, i) => 24 + i);
  color(g, cells);
  g.board[26].sweet!.color = "berry";
  color(g, [18]);
  return g;
}
function pair(a: Special, b: Special): Game {
  const g = board();
  g.board[27].sweet = { color: "rose", special: a, id: 28 };
  g.board[28].sweet = { color: "mint", special: b, id: 29 };
  return g;
}
const set = (ids: number[]) => new Set(ids);
const area = (c: number, r: number) =>
  Array.from({ length: 64 }, (_, i) => i).filter(
    (i) =>
      Math.abs(Math.floor(i / 8) - Math.floor(c / 8)) <= r &&
      Math.abs((i % 8) - (c % 8)) <= r,
  );
const cross = (c: number, w = 0) =>
  Array.from({ length: 64 }, (_, i) => i).filter(
    (i) =>
      Math.abs(Math.floor(i / 8) - Math.floor(c / 8)) <= w ||
      Math.abs((i % 8) - (c % 8)) <= w,
  );

describe("public board and move rules", () => {
  it("generates repeatable settled playable boards for all six authored stages", () => {
    expect(STAGES).toHaveLength(6);
    for (let level = 0; level < STAGES.length; level++) {
      const g = createGame(level);
      expect(g).toEqual(createGame(level));
      expect(findRuns(g.board)).toEqual([]);
      expect(availableMoves(g).length).toBeGreaterThan(0);
      expect(g.moves).toBe(STAGES[level].moves);
      expect(objectiveProgress(g).length).toBeGreaterThan(0);
    }
  });
  it("rejects invalid, nonadjacent, fractional, edge-wrap and blocked swaps without mutating or spending moves", () => {
    const g = board();
    const before = clone(g);
    for (const [a, b] of [
      [0, 1],
      [7, 8],
      [-1, 0],
      [0, 64],
      [0, 0],
      [0, 1.5],
    ]) {
      const turn = attemptSwap(g, a, b);
      expect(turn.valid).toBe(false);
      expect(turn.game).toEqual(before);
      expect(turn.frames).toEqual([]);
    }
    g.board[1] = { sweet: null, block: 2, glaze: 0 };
    expect(attemptSwap(g, 0, 1).game).toEqual(g);
    expect(g).not.toEqual(before);
    expect(adjacent(7, 8)).toBe(false);
    expect(adjacent(0, 8)).toBe(true);
  });
  it("a valid match resolves cascades with exactly one move and never changes the input", () => {
    const g = line(3),
      before = clone(g);
    expect(findRuns(g.board)).toEqual([]);
    const t = attemptSwap(g, 18, 26);
    expect(t.valid).toBe(true);
    expect(t.game.moves).toBe(g.moves - 1);
    expect(g).toEqual(before);
    expect(t.frames[1].hits).toEqual(expect.arrayContaining([24, 25, 26]));
    expect(t.game.collected.rose).toBeGreaterThanOrEqual(3);
    expect(findRuns(t.game.board)).toEqual([]);
    expect(t.cascades).toBeGreaterThan(0);
    expect(t.frames.some((f) => f.label.startsWith("Cascade"))).toBe(true);
  });
  it("reshuffles dead boards for free preserving tile layers, candy IDs and specials", () => {
    const g = board();
    g.board[0].sweet!.special = "row";
    g.board[63].sweet!.special = "column";
    g.board[7] = { sweet: null, block: 2, glaze: 0 };
    expect(availableMoves(g)).toEqual([]);
    g.board[0].glaze = 2;
    const before = clone(g);
    const ids = g.board
      .flatMap((c) => (c.sweet ? [c.sweet.id] : []))
      .sort((a, b) => a - b);
    expect(ensureMoves(g)).toBe(true);
    expect(g.moves).toBe(before.moves);
    expect(g.board[0].glaze).toBe(2);
    expect(
      g.board
        .flatMap((c) => (c.sweet ? [c.sweet.id] : []))
        .sort((a, b) => a - b),
    ).toEqual(ids);
    expect(g.board[7].block).toBe(2);
    expect(
      g.board
        .flatMap((c) => (c.sweet?.special ? [c.sweet.special] : []))
        .sort(),
    ).toEqual(["column", "row"]);
    expect(findRuns(g.board)).toEqual([]);
    expect(availableMoves(g).length).toBeGreaterThan(0);
    const live = pair("row", "parcel"),
      snapshot = clone(live);
    expect(ensureMoves(live)).toBe(false);
    expect(live).toEqual(snapshot);
  });
});

describe("special creation and activation", () => {
  it.each([
    [4, "column"],
    [5, "prism"],
  ] as const)(
    "vertical switch making a horizontal run of %i creates %s at destination",
    (length, special) => {
      const g = line(length);
      expect(findRuns(g.board)).toEqual([]);
      g.board[26].glaze = 2;
      const t = attemptSwap(g, 18, 26);
      expect(t.valid).toBe(true);
      expect(t.frames[1].board[26].sweet?.special).toBe(special);
      expect(t.frames[1].board[26].glaze).toBe(1);
      expect(t.game.specials).toBeGreaterThanOrEqual(1);
    },
  );
  it("horizontal switch creating four makes a row stripe", () => {
    const g = board();
    color(g, [11, 19, 35, 26]);
    g.board[27].sweet!.color = "berry";
    expect(findRuns(g.board)).toEqual([]);
    const t = attemptSwap(g, 26, 27);
    expect(t.valid).toBe(true);
    expect(t.frames[1].board[27].sweet?.special).toBe("row");
  });
  it.each([
    { name: "T", cells: [25, 26, 19, 35, 28], source: 28, target: 27 },
    { name: "L", cells: [24, 25, 34, 42, 18], source: 18, target: 26 },
  ])("$name intersection creates a parcel", ({ cells, source, target }) => {
    const g = board();
    color(g, cells);
    g.board[target].sweet!.color = "berry";
    g.board[50].sweet!.color = "mint";
    expect(findRuns(g.board)).toEqual([]);
    const t = attemptSwap(g, source, target);
    expect(t.valid).toBe(true);
    expect(t.frames[1].board[target].sweet?.special).toBe("parcel");
  });
  it.each(["row", "column"] as const)(
    "a matched %s stripe clears its whole line and chains another stripe once",
    (special) => {
      const g = line(3);
      g.board[24].sweet!.special = special;
      g.board[special === "row" ? 31 : 56].sweet!.special =
        special === "row" ? "column" : "row";
      const t = attemptSwap(g, 18, 26);
      const hits = t.frames[1].hits;
      const expected =
        special === "row"
          ? Array.from({ length: 8 }, (_, i) => 24 + i)
          : Array.from({ length: 8 }, (_, i) => i * 8);
      expect(hits).toEqual(expect.arrayContaining(expected));
      expect(new Set(hits).size).toBe(hits.length);
    },
  );
  it("parcel follows its surviving candy through gravity before its second 3×3 pulse", () => {
    const g = board();
    color(g, [25, 26, 19]);
    g.board[27].sweet!.color = "berry";
    g.board[19].sweet!.special = "parcel";
    const id = g.board[19].sweet!.id;
    const t = attemptSwap(g, 19, 27);
    expect(t.valid).toBe(true);
    expect(t.frames[1].hits).toEqual(expect.arrayContaining(area(27, 1)));
    const fallen = t.frames[2].board.findIndex((c) => c.sweet?.id === id);
    expect(fallen).not.toBe(27);
    expect(fallen).toBeGreaterThan(27);
    expect(t.frames[3].label).toBe("Parcel · second pop!");
    expect(set(t.frames[3].hits)).toEqual(set(area(fallen, 1)));
    expect(t.frames[3].board.some((c) => c.sweet?.id === id)).toBe(false);
  });
});

describe("six special combinations", () => {
  it.each([
    ["row", "column"],
    ["column", "row"],
    ["row", "row"],
    ["column", "column"],
  ] as const)(
    "%s + %s clears a row and column despite different colors",
    (a, b) => {
      const t = attemptSwap(pair(a, b), 27, 28);
      expect(t.valid).toBe(true);
      expect(set(t.frames[1].hits)).toEqual(set(cross(28)));
      expect(t.game.moves).toBe(STAGES[0].moves - 1);
    },
  );
  it.each([
    ["row", "parcel"],
    ["parcel", "column"],
  ] as const)("%s + %s clears three rows and columns", (a, b) => {
    const t = attemptSwap(pair(a, b), 27, 28);
    expect(set(t.frames[1].hits)).toEqual(set(cross(28, 1)));
  });
  it("parcel + parcel makes two 5×5 blasts, with gravity between", () => {
    const t = attemptSwap(pair("parcel", "parcel"), 27, 28);
    expect(set(t.frames[1].hits)).toEqual(set(area(28, 2)));
    expect(t.frames[2].label).toBe("Fresh sweets tumble in");
    expect(set(t.frames[3].hits)).toEqual(set(area(28, 2)));
  });
  it.each([
    { a: "parcel", b: "parcel", expected: area(1, 2) },
    { a: "parcel", b: "row", expected: cross(1, 1) },
    { a: "column", b: "row", expected: cross(1) },
  ] as const)(
    "$a + $b clips safely at the upper edge",
    ({ a, b, expected }) => {
      const g = board();
      g.board[0].sweet!.special = a;
      g.board[1].sweet!.special = b;
      const t = attemptSwap(g, 0, 1);
      expect(t.valid).toBe(true);
      expect(set(t.frames[1].hits)).toEqual(set(expected));
      expect(t.frames.every((f) => f.hits.every((i) => i >= 0 && i < 64))).toBe(
        true,
      );
    },
  );
  it("prism + normal clears every candy of the partner color in either swap order", () => {
    for (const reversed of [false, true]) {
      const g = board();
      g.board[27].sweet!.special = "prism";
      const partner = g.board[28].sweet!.color;
      const t = attemptSwap(g, reversed ? 28 : 27, reversed ? 27 : 28);
      const expected = t.frames[0].board.flatMap((c, i) =>
        c.sweet?.color === partner ? [i] : [],
      );
      expect(t.valid).toBe(true);
      expect(t.frames[1].hits).toEqual(
        expect.arrayContaining([...expected, 27, 28]),
      );
    }
  });
  it.each(["row", "column", "parcel"] as const)(
    "prism + %s converts and activates all partner-color candies",
    (special) => {
      const g = pair("prism", special);
      const t = attemptSwap(g, 27, 28);
      const targets = t.frames[0].board.flatMap((c, i) =>
        c.sweet?.color === "mint" ? [i] : [],
      );
      expect(t.frames[1].hits).toEqual(expect.arrayContaining(targets));
      if (special === "parcel")
        expect(t.frames.some((f) => f.label === "Parcel · second pop!")).toBe(
          true,
        );
      else
        expect(
          t.frames[1].board.filter((c) => c.sweet?.color === "mint"),
        ).toHaveLength(0);
    },
  );
  it("prism + prism hits all 64 tiles and removes at most one blocker/glaze layer in that pulse", () => {
    const g = pair("prism", "prism");
    g.board[0] = { sweet: null, block: 2, glaze: 0 };
    g.board[1].glaze = 2;
    const t = attemptSwap(g, 27, 28);
    expect(set(t.frames[1].hits).size).toBe(64);
    expect(t.frames[1].board[0].block).toBe(1);
    expect(t.frames[1].board[1].glaze).toBe(1);
  });
});

describe("objective and terminal accounting", () => {
  it("counts layered blockers once per pulse even when hit directly and from several adjacent candies", () => {
    const g = pair("row", "parcel");
    g.board[20] = { sweet: null, block: 2, glaze: 0 };
    const t = attemptSwap(g, 27, 28);
    expect(t.frames[1].board[20].block).toBe(1);
    expect(t.game.blocks).toBeGreaterThanOrEqual(1);
  });
  it("gravity cannot pull candies through a surviving meringue tile", () => {
    const g = pair("row", "column");
    g.board[35] = { sweet: null, block: 2, glaze: 0 };
    const below = [43, 51, 59].map((i) => g.board[i].sweet!.id),
      above = g.board[19].sweet!.id;
    const t = attemptSwap(g, 27, 28);
    expect(t.frames[1].board[35].block).toBe(2);
    expect([43, 51, 59].map((i) => t.frames[2].board[i].sweet!.id)).toEqual(
      below,
    );
    expect(t.frames[2].board[27].sweet!.id).toBe(above);
  });
  it("replays legal campaign moves deterministically with settled boards and unique candy IDs", () => {
    for (let level = 0; level < STAGES.length; level++) {
      let g = createGame(level);
      for (let step = 0; step < 8 && g.status === "playing"; step++) {
        const moves = availableMoves(g);
        expect(moves.length).toBeGreaterThan(0);
        const [a, b] = moves[step % moves.length];
        const t = attemptSwap(g, a, b);
        expect(t).toEqual(attemptSwap(g, a, b));
        expect(t.valid).toBe(true);
        expect(t.game.moves).toBe(g.moves - 1);
        const ids = t.game.board.flatMap((c) => (c.sweet ? [c.sweet.id] : []));
        expect(new Set(ids).size).toBe(ids.length);
        expect(findRuns(t.game.board)).toEqual([]);
        expect(
          t.game.board.every(
            (c) =>
              c.block >= 0 &&
              c.glaze >= 0 &&
              (c.block === 0 ? c.sweet !== null : c.sweet === null),
          ),
        ).toBe(true);
        g = t.game;
      }
    }
  });
  it("a last-move completion wins before move exhaustion, while unmet goals lose", () => {
    const g = line(3);
    g.moves = 1;
    g.collected.rose = 12;
    g.collected.mint = 12;
    const won = attemptSwap(g, 18, 26).game;
    expect(won.moves).toBe(0);
    expect(won.status).toBe("won");
    expect(attemptSwap(won, 0, 1).valid).toBe(false);
    const loss = line(3);
    loss.moves = 1;
    const lost = attemptSwap(loss, 18, 26).game;
    expect(lost.status).toBe("lost");
    expect(lost.moves).toBe(0);
    expect(attemptSwap(lost, 0, 1).game).toEqual(lost);
  });
  it("evaluates each authored objective and a restart restores the stage baseline", () => {
    for (let i = 0; i < STAGES.length; i++) {
      const g = createGame(i);
      g.moves = 0;
      evaluate(g);
      expect(g.status).toBe("lost");
      for (const c of COLORS) g.collected[c] = 1000;
      g.blocks = 1000;
      g.glaze = 1000;
      g.specials = 1000;
      evaluate(g);
      expect(g.status).toBe("won");
      expect(createGame(i).status).toBe("playing");
      expect(createGame(i).score).toBe(0);
    }
  });
});

describe("review regressions: precise blast footprints", () => {
  it.each(["row", "column", "parcel"] as const)(
    "prism activates a uniquely colored %s partner at its post-swap tile in both orders",
    (special) => {
      for (const partnerStart of [27, 28])
        for (const reverse of [false, true]) {
          const g = board();
          // A four-color settled background makes rose unique to the partner.
          for (let i = 0; i < 64; i++)
            g.board[i].sweet!.color =
              COLORS[1 + ((Math.floor(i / 8) + 2 * (i % 8)) % 4)];
          const prismStart = partnerStart === 27 ? 28 : 27;
          g.board[partnerStart].sweet!.color = "rose";
          g.board[partnerStart].sweet!.special = special;
          g.board[prismStart].sweet!.special = "prism";
          expect(findRuns(g.board)).toEqual([]);
          const t = attemptSwap(g, reverse ? 28 : 27, reverse ? 27 : 28);
          expect(t.valid).toBe(true);
          const center = prismStart,
            hits = set(t.frames[1].hits);
          if (special === "parcel") {
            expect(hits).toEqual(set([...area(center, 1), partnerStart]));
            expect(
              t.frames.some((f) => f.label === "Parcel · second pop!"),
            ).toBe(true);
          } else {
            const row = Array.from(
              { length: 8 },
              (_, c) => Math.floor(center / 8) * 8 + c,
            );
            const column = Array.from(
              { length: 8 },
              (_, r) => r * 8 + (center % 8),
            );
            expect(
              row.every((i) => hits.has(i)) || column.every((i) => hits.has(i)),
            ).toBe(true);
            expect(hits.size).toBeGreaterThanOrEqual(8);
          }
        }
    },
  );
  it("a matched stripe does not damage a blocker adjacent only to a distant blast tile", () => {
    const g = line(3);
    g.board[24].sweet!.special = "row";
    g.board[39] = { sweet: null, block: 2, glaze: 0 };
    const t = attemptSwap(g, 18, 26);
    expect(t.valid).toBe(true);
    expect(t.frames[1].hits).toContain(31);
    expect(t.frames[1].hits).not.toContain(39);
    expect(t.frames[1].board[39].block).toBe(2);
  });
  it("a parcel does not damage a blocker outside its radius merely adjacent to the blast edge", () => {
    const g = board();
    color(g, [25, 26, 19]);
    g.board[27].sweet!.color = "berry";
    g.board[19].sweet!.special = "parcel";
    g.board[37] = { sweet: null, block: 2, glaze: 0 };
    const t = attemptSwap(g, 19, 27);
    expect(t.valid).toBe(true);
    expect(t.frames[1].hits).toContain(36);
    expect(t.frames[1].hits).not.toContain(37);
    expect(t.frames[1].board[37].block).toBe(2);
  });
  it("ordinary intersecting matches still damage a shared adjacent blocker only once", () => {
    const g = board();
    color(g, [25, 26, 19, 35, 28]);
    g.board[27].sweet!.color = "berry";
    g.board[18] = { sweet: null, block: 2, glaze: 0 };
    expect(findRuns(g.board)).toEqual([]);
    const t = attemptSwap(g, 28, 27);
    expect(t.valid).toBe(true);
    // Tile 18 touches both matched cells 19 and 26, outside the parcel's creation tile.
    expect(t.frames[1].hits).toContain(18);
    expect(t.frames[1].board[18].block).toBe(1);
  });
});
