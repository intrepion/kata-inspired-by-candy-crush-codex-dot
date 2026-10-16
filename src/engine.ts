export const COLORS = ["rose", "citrus", "lemon", "mint", "berry"] as const;
export type Color = (typeof COLORS)[number];
export type Special = "row" | "column" | "parcel" | "prism";
export interface Sweet {
  color: Color;
  special?: Special;
  id: number;
}
export interface Cell {
  sweet: Sweet | null;
  glaze: number;
  block: number;
}
export interface Goals {
  collect?: Partial<Record<Color, number>>;
  glaze?: number;
  blocks?: number;
  specials?: number;
}
export interface Stage {
  name: string;
  subtitle: string;
  moves: number;
  seed: number;
  goals: Goals;
  glaze: number[];
  blocks: number[];
  layers?: number;
  gifts?: [number, Special][];
}
export interface Game {
  level: number;
  board: Cell[];
  moves: number;
  score: number;
  seed: number;
  nextId: number;
  collected: Record<Color, number>;
  glaze: number;
  blocks: number;
  specials: number;
  status: "playing" | "won" | "lost";
}
export interface Frame {
  board: Cell[];
  hits: number[];
  label: string;
  score: number;
}
export interface Turn {
  game: Game;
  valid: boolean;
  frames: Frame[];
  message: string;
  cascades: number;
}
export const STAGES: Stage[] = [
  {
    name: "Sugar Square",
    subtitle: "First stop, something sweet.",
    moves: 16,
    seed: 1240,
    goals: { collect: { rose: 12, mint: 12 } },
    glaze: [],
    blocks: [],
  },
  {
    name: "Glaze Gardens",
    subtitle: "Clear the sparkling paths.",
    moves: 23,
    seed: 9521,
    goals: { glaze: 18 },
    glaze: [
      18, 19, 20, 21, 26, 27, 28, 29, 34, 35, 36, 37, 42, 43, 44, 45, 50, 51,
    ],
    blocks: [],
  },
  {
    name: "Meringue Market",
    subtitle: "Break through the bakery walls.",
    moves: 24,
    seed: 81274,
    goals: { blocks: 12, collect: { citrus: 15 } },
    glaze: [],
    blocks: [18, 21, 26, 29, 34, 37],
    layers: 2,
  },
  {
    name: "Ribbon Railway",
    subtitle: "Make specials. Clear the tracks.",
    moves: 24,
    seed: 3215,
    goals: { specials: 4, glaze: 16 },
    glaze: [16, 17, 18, 19, 20, 21, 22, 23],
    blocks: [],
    layers: 2,
    gifts: [
      [56, "row"],
      [57, "column"],
    ],
  },
  {
    name: "Prism Promenade",
    subtitle: "A little teamwork goes a long way.",
    moves: 26,
    seed: 87612,
    goals: { blocks: 16, glaze: 24 },
    glaze: [3, 4, 11, 12, 51, 52, 59, 60, 24, 31, 32, 39],
    blocks: [18, 19, 20, 21, 42, 43, 44, 45],
    layers: 2,
    gifts: [
      [56, "prism"],
      [61, "parcel"],
    ],
  },
  {
    name: "The Grand Patisserie",
    subtitle: "Bring the whole borough together.",
    moves: 30,
    seed: 41852,
    goals: { glaze: 32, blocks: 16, collect: { berry: 24 } },
    glaze: [0, 1, 2, 3, 4, 5, 6, 7, 56, 57, 58, 59, 60, 61, 62, 63],
    blocks: [18, 19, 20, 21, 42, 43, 44, 45],
    layers: 2,
    gifts: [
      [27, "row"],
      [28, "parcel"],
    ],
  },
];
export const clone = <T>(v: T): T => structuredClone(v);
function random(g: Game): number {
  let x = g.seed | 0;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  g.seed = x >>> 0;
  return g.seed / 4294967296;
}
function candy(g: Game): Sweet {
  return { color: COLORS[Math.floor(random(g) * 5)], id: g.nextId++ };
}
export function adjacent(a: number, b: number): boolean {
  return (
    a >= 0 &&
    b >= 0 &&
    a < 64 &&
    b < 64 &&
    (Math.abs(a - b) === 8 ||
      (Math.floor(a / 8) === Math.floor(b / 8) && Math.abs(a - b) === 1))
  );
}
function neighbors(i: number): number[] {
  return [i - 8, i + 8, i - 1, i + 1].filter((j) => adjacent(i, j));
}
interface Run {
  cells: number[];
  axis: "row" | "column";
}
export function findRuns(board: Cell[]): Run[] {
  const runs: Run[] = [];
  for (const axis of ["row", "column"] as const)
    for (let line = 0; line < 8; line++) {
      let cells: number[] = [];
      let previous: Color | undefined;
      for (let p = 0; p <= 8; p++) {
        const i = axis === "row" ? line * 8 + p : p * 8 + line;
        const s = p < 8 ? board[i].sweet : null;
        const c = s && s.special !== "prism" ? s.color : undefined;
        if (c && c === previous) cells.push(i);
        else {
          if (cells.length >= 3) runs.push({ cells: [...cells], axis });
          cells = c ? [i] : [];
          previous = c;
        }
      }
    }
  return runs;
}
function swap(board: Cell[], a: number, b: number): boolean {
  if (
    !adjacent(a, b) ||
    board[a].block ||
    board[b].block ||
    !board[a].sweet ||
    !board[b].sweet
  )
    return false;
  [board[a].sweet, board[b].sweet] = [board[b].sweet, board[a].sweet];
  return true;
}
export function availableMoves(g: Game): [number, number][] {
  const result: [number, number][] = [];
  for (let a = 0; a < 64; a++)
    for (const b of [a + 1, a + 8]) {
      if (!adjacent(a, b)) continue;
      const x = g.board[a].sweet,
        y = g.board[b].sweet;
      if (!x || !y || g.board[a].block || g.board[b].block) continue;
      if (
        x.special === "prism" ||
        y.special === "prism" ||
        (x.special && y.special)
      ) {
        result.push([a, b]);
        continue;
      }
      swap(g.board, a, b);
      const valid = findRuns(g.board).some(
        (r) => r.cells.includes(a) || r.cells.includes(b),
      );
      swap(g.board, a, b);
      if (valid) result.push([a, b]);
    }
  return result;
}
export function ensureMoves(g: Game): boolean {
  if (availableMoves(g).length) return false;
  const indices = g.board.flatMap((c, i) => (c.sweet ? [i] : [])),
    sweets = indices.map((i) => g.board[i].sweet!);
  for (let attempt = 0; attempt < 1000; attempt++) {
    for (let i = sweets.length - 1; i > 0; i--) {
      const j = Math.floor(random(g) * (i + 1));
      [sweets[i], sweets[j]] = [sweets[j], sweets[i]];
    }
    indices.forEach((i, j) => (g.board[i].sweet = sweets[j]));
    if (!findRuns(g.board).length && availableMoves(g).length) return true;
  }
  throw new Error("Board could not be reshuffled");
}
export function createGame(level = 0): Game {
  const stage = STAGES[level];
  if (!stage) throw new Error("Unknown stage");
  const g: Game = {
    level,
    board: [],
    moves: stage.moves,
    score: 0,
    seed: stage.seed,
    nextId: 1,
    collected: { rose: 0, citrus: 0, lemon: 0, mint: 0, berry: 0 },
    glaze: 0,
    blocks: 0,
    specials: 0,
    status: "playing",
  };
  for (let i = 0; i < 64; i++) {
    let s = candy(g);
    while (
      (i % 8 >= 2 &&
        g.board[i - 1].sweet?.color === s.color &&
        g.board[i - 2].sweet?.color === s.color) ||
      (i >= 16 &&
        g.board[i - 8].sweet?.color === s.color &&
        g.board[i - 16].sweet?.color === s.color)
    )
      s = candy(g);
    g.board.push({
      sweet: stage.blocks.includes(i) ? null : s,
      glaze: stage.glaze.includes(i) ? (stage.layers ?? 1) : 0,
      block: stage.blocks.includes(i) ? (stage.layers ?? 1) : 0,
    });
  }
  for (const [i, special] of stage.gifts ?? [])
    g.board[i].sweet!.special = special;
  ensureMoves(g);
  return g;
}
function area(center: number, radius: number): number[] {
  return Array.from({ length: 64 }, (_, i) => i).filter(
    (i) =>
      Math.abs(Math.floor(i / 8) - Math.floor(center / 8)) <= radius &&
      Math.abs((i % 8) - (center % 8)) <= radius,
  );
}
function cross(center: number, width = 0): number[] {
  return Array.from({ length: 64 }, (_, i) => i).filter(
    (i) =>
      Math.abs(Math.floor(i / 8) - Math.floor(center / 8)) <= width ||
      Math.abs((i % 8) - (center % 8)) <= width,
  );
}
function gravity(g: Game): void {
  for (let c = 0; c < 8; c++) {
    let segment: number[] = [];
    const drop = () => {
      const sweets = segment
        .map((i) => g.board[i].sweet)
        .filter((s): s is Sweet => !!s);
      for (let j = segment.length - 1; j >= 0; j--)
        g.board[segment[j]].sweet = sweets.pop() ?? candy(g);
      segment = [];
    };
    for (let r = 0; r <= 8; r++) {
      const i = r * 8 + c;
      if (r === 8 || g.board[i].block) drop();
      else segment.push(i);
    }
  }
}
interface Delayed {
  center: number;
  radius: number;
  id?: number;
}
function pulse(
  g: Game,
  initial: Iterable<number>,
  protect: Set<number>,
  frames: Frame[],
  label: string,
  delayed: Delayed[],
  matched: Iterable<number> = [],
): void {
  const hits = new Set(initial),
    activated = new Set<number>(),
    survivors = new Set<number>();
  const add = (ids: number[]) => ids.forEach((i) => hits.add(i));
  let changed = true;
  while (changed) {
    changed = false;
    for (const i of [...hits]) {
      if (activated.has(i) || protect.has(i)) continue;
      activated.add(i);
      const s = g.board[i].sweet;
      if (!s?.special) continue;
      changed = true;
      if (s.special === "row")
        add(Array.from({ length: 8 }, (_, c) => Math.floor(i / 8) * 8 + c));
      if (s.special === "column")
        add(Array.from({ length: 8 }, (_, r) => r * 8 + (i % 8)));
      if (s.special === "parcel") {
        add(area(i, 1));
        delayed.push({ center: i, radius: 1, id: s.id });
        survivors.add(i);
      }
      if (s.special === "prism") {
        const color = COLORS[Math.floor(random(g) * 5)];
        add(g.board.flatMap((c, j) => (c.sweet?.color === color ? [j] : [])));
      }
    }
  }
  const blockHits = new Set<number>();
  for (const i of hits) {
    const cell = g.board[i];
    if (cell.block) {
      blockHits.add(i);
      continue;
    }
    if (cell.glaze) {
      cell.glaze--;
      g.glaze++;
      g.score += 40;
    }
    if (cell.sweet && !protect.has(i)) {
      if (survivors.has(i)) {
        delete cell.sweet.special;
      } else {
        g.collected[cell.sweet.color]++;
        g.score += 60;
        cell.sweet = null;
      }
    }
  }
  // Only actual matches damage adjacent blockers; blasts must hit them directly.
  for (const i of matched)
    for (const n of neighbors(i)) if (g.board[n].block) blockHits.add(n);
  for (const i of blockHits) {
    g.board[i].block--;
    g.blocks++;
    g.score += 40;
  }
  frames.push({
    board: clone(g.board),
    hits: [...hits, ...blockHits],
    label,
    score: g.score,
  });
  gravity(g);
  frames.push({
    board: clone(g.board),
    hits: [],
    label: "Fresh sweets tumble in",
    score: g.score,
  });
}
function matchPulse(
  g: Game,
  runs: Run[],
  preferred: number[],
  frames: Frame[],
  label: string,
  delayed: Delayed[],
): void {
  const groups: Run[][] = [];
  for (const run of runs) {
    const touched = groups.filter((group) =>
      group.some((r) => r.cells.some((i) => run.cells.includes(i))),
    );
    const merged = [run, ...touched.flat()];
    for (const group of touched) groups.splice(groups.indexOf(group), 1);
    groups.push(merged);
  }
  const protect = new Set<number>(),
    hits = new Set<number>();
  for (const group of groups) {
    const ids = [...new Set(group.flatMap((r) => r.cells))];
    ids.forEach((i) => hits.add(i));
    const longest = group.reduce((a, b) =>
        a.cells.length > b.cells.length ? a : b,
      ),
      intersection = ids.find(
        (i) => group.filter((r) => r.cells.includes(i)).length > 1,
      );
    let special: Special | undefined;
    if (longest.cells.length >= 5) special = "prism";
    else if (intersection !== undefined) special = "parcel";
    else if (longest.cells.length === 4)
      special =
        preferred.length === 2
          ? Math.abs(preferred[0] - preferred[1]) === 1
            ? "row"
            : "column"
          : longest.axis === "row"
            ? "column"
            : "row";
    if (special) {
      const candidates = [
        ...preferred,
        ...(intersection === undefined ? [] : [intersection]),
        ...longest.cells.slice(Math.floor(longest.cells.length / 2)),
        ...ids,
      ];
      const i = candidates.find(
        (p) =>
          ids.includes(p) && g.board[p].sweet && !g.board[p].sweet?.special,
      );
      if (i !== undefined) {
        g.collected[g.board[i].sweet!.color]++;
        g.board[i].sweet!.special = special;
        g.specials++;
        g.score += 120;
        protect.add(i);
      }
    }
  }
  pulse(g, hits, protect, frames, label, delayed, hits);
}
function combination(
  g: Game,
  a: number,
  b: number,
  frames: Frame[],
  delayed: Delayed[],
): void {
  const x = g.board[a].sweet!,
    y = g.board[b].sweet!,
    sx = x.special,
    sy = y.special,
    hits = new Set([a, b]);
  const add = (ids: number[]) => ids.forEach((i) => hits.add(i));
  g.collected[x.color]++;
  g.collected[y.color]++;
  g.board[a].sweet = null;
  g.board[b].sweet = null;
  g.score += 120;
  if (sx === "prism" || sy === "prism") {
    if (sx === "prism" && sy === "prism")
      add(Array.from({ length: 64 }, (_, i) => i));
    else {
      const target = sx === "prism" ? y : x;
      // The partner also participates: a unique-color stripe/parcel must still fire.
      g.board[sx === "prism" ? b : a].sweet = target;
      g.collected[target.color]--;
      g.score -= 60;
      for (let i = 0; i < 64; i++)
        if (g.board[i].sweet?.color === target.color) {
          hits.add(i);
          if (target.special)
            g.board[i].sweet!.special =
              target.special === "parcel"
                ? "parcel"
                : random(g) < 0.5
                  ? "row"
                  : "column";
        }
    }
  } else if (sx === "parcel" && sy === "parcel") {
    add(area(b, 2));
    delayed.push({ center: b, radius: 2 });
  } else if (sx === "parcel" || sy === "parcel") add(cross(b, 1));
  else add(cross(b));
  pulse(g, hits, new Set(), frames, "Sweet combination!", delayed);
}
export function objectiveProgress(
  g: Game,
): { label: string; current: number; target: number }[] {
  const goals = STAGES[g.level].goals,
    result: { label: string; current: number; target: number }[] = [];
  for (const [color, target] of Object.entries(goals.collect ?? {}))
    result.push({ label: color, current: g.collected[color as Color], target });
  if (goals.glaze)
    result.push({ label: "glaze", current: g.glaze, target: goals.glaze });
  if (goals.blocks)
    result.push({ label: "meringue", current: g.blocks, target: goals.blocks });
  if (goals.specials)
    result.push({
      label: "specials made",
      current: g.specials,
      target: goals.specials,
    });
  return result;
}
export function evaluate(g: Game): void {
  g.status = objectiveProgress(g).every((p) => p.current >= p.target)
    ? "won"
    : g.moves <= 0
      ? "lost"
      : "playing";
}
export function attemptSwap(original: Game, a: number, b: number): Turn {
  const g = clone(original),
    frames: Frame[] = [];
  let cascades = 0;
  const invalid = (message: string): Turn => ({
    game: clone(original),
    valid: false,
    frames: [],
    message,
    cascades: 0,
  });
  if (g.status !== "playing") return invalid("This stage has ended.");
  if (!Number.isInteger(a) || !Number.isInteger(b) || !adjacent(a, b))
    return invalid("Choose neighboring sweets.");
  if (!swap(g.board, a, b))
    return invalid("Meringue stays put. Match beside it.");
  const x = g.board[a].sweet!,
    y = g.board[b].sweet!,
    combo =
      x.special === "prism" ||
      y.special === "prism" ||
      !!(x.special && y.special);
  let runs = findRuns(g.board);
  if (!combo && !runs.some((r) => r.cells.includes(a) || r.cells.includes(b)))
    return invalid("No match — no move spent.");
  g.moves--;
  frames.push({
    board: clone(g.board),
    hits: [],
    label: "A sweet switch",
    score: g.score,
  });
  const delayed: Delayed[] = [];
  if (combo) combination(g, a, b, frames, delayed);
  else matchPulse(g, runs, [b, a], frames, "Lovely match!", delayed);
  for (let safety = 0; safety < 500; safety++) {
    if (delayed.length) {
      const pending = delayed.splice(0);
      const hits = new Set<number>();
      for (const p of pending) {
        const center =
          p.id === undefined
            ? p.center
            : g.board.findIndex((c) => c.sweet?.id === p.id);
        area(center < 0 ? p.center : center, p.radius).forEach((i) =>
          hits.add(i),
        );
      }
      pulse(g, hits, new Set(), frames, "Parcel · second pop!", delayed);
      continue;
    }
    runs = findRuns(g.board);
    if (!runs.length) break;
    cascades++;
    matchPulse(g, runs, [], frames, `Cascade ×${cascades + 1}`, delayed);
    if (safety === 499) throw new Error("Cascade limit exceeded");
  }
  evaluate(g);
  const status: Game["status"] = clone(g).status;
  let shuffled = false;
  if (g.status === "playing") shuffled = ensureMoves(g);
  if (shuffled)
    frames.push({
      board: clone(g.board),
      hits: [],
      label: "No moves? A free reshuffle!",
      score: g.score,
    });
  return {
    game: g,
    valid: true,
    frames,
    message:
      status === "won"
        ? "Stage complete!"
        : status === "lost"
          ? "Out of moves. Try a fresh batch."
          : shuffled
            ? "Freshly shuffled — no move spent."
            : cascades
              ? `Delicious! ${cascades + 1} matches in one move.`
              : "Lovely match!",
    cascades,
  };
}
