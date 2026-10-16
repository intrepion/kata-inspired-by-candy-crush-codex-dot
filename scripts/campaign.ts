import { writeFileSync } from "node:fs";
import {
  createGame,
  attemptSwap,
  availableMoves,
  objectiveProgress,
  STAGES,
  type Game,
} from "../src/engine.ts";
function value(g: Game): number {
  return objectiveProgress(g).reduce(
    (sum, p) => sum + Math.min(p.current, p.target) / p.target,
    0,
  );
}
const evidence = [];
for (let level = 0; level < STAGES.length; level++) {
  let g = createGame(level);
  const path: [number, number][] = [];
  while (g.status === "playing") {
    const options = availableMoves(g).map((m) => ({
      m,
      t: attemptSwap(g, ...m),
    }));
    options.sort(
      (a, b) =>
        (value(b.t.game) - value(a.t.game)) * 100000 +
        (b.t.game.score - a.t.game.score),
    );
    // Greedy objective-first simulation, not a human or a difficulty guarantee.
    const best = options[0];
    path.push(best.m);
    g = best.t.game;
  }
  evidence.push({
    level: level + 1,
    name: STAGES[level].name,
    status: g.status,
    movesLeft: g.moves,
    score: g.score,
    path,
    goals: objectiveProgress(g),
  });
}
writeFileSync(
  "docs/campaign-simulation.json",
  JSON.stringify(evidence, null, 2) + "\n",
);
console.log(
  evidence.map((e) => ({
    level: e.level,
    status: e.status,
    moves: e.path.length,
    remaining: e.movesLeft,
  })),
);
