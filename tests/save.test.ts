import { describe, it, expect } from "vitest";
import { createGame, attemptSwap, availableMoves } from "../src/engine";
import { decodeSave, encodeSave, SAVE_KEY, type Save } from "../src/save";
function sample(): Save {
  return { version: 1, unlocked: 0, game: createGame(), sound: false };
}
describe("isolated, defensive campaign saves", () => {
  it("round trips a settled board and resumes deterministic next turn", () => {
    const save = sample();
    const move = availableMoves(save.game)[0];
    save.game = attemptSwap(save.game, ...move).game;
    const decoded = decodeSave(encodeSave(save));
    expect(decoded).toEqual(save);
    const next = availableMoves(save.game)[0];
    expect(attemptSwap(decoded!.game, ...next)).toEqual(
      attemptSwap(save.game, ...next),
    );
  });
  it("uses a project-only versioned key", () =>
    expect(SAVE_KEY).toBe("bonbon-borough:campaign:v1"));
  it.each([null, "not json", "{}", "null", '{"version":2}'])(
    "rejects malformed data %s",
    (raw) => expect(decodeSave(raw)).toBeNull(),
  );
  it("rejects locked stages, duplicate IDs, impossible cells and non-finite counts", () => {
    for (const mutate of [
      (s: Save) => {
        s.game.level = 1;
      },
      (s: Save) => {
        s.game.board[1].sweet!.id = s.game.board[0].sweet!.id;
      },
      (s: Save) => {
        s.game.board[0].block = 2;
      },
      (s: Save) => {
        s.game.moves = -1;
      },
      (s: Save) => {
        s.game.status = "won";
      },
    ]) {
      const s = sample();
      mutate(s);
      expect(decodeSave(encodeSave(s))).toBeNull();
    }
  });
  it("accepts an unlocked later stage with blockers", () => {
    const s = sample();
    s.unlocked = 3;
    s.game = createGame(3);
    expect(decodeSave(encodeSave(s))).toEqual(s);
  });
});
