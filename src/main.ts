import "./style.css";
import {
  STAGES,
  adjacent,
  attemptSwap,
  availableMoves,
  clone,
  createGame,
  objectiveProgress,
  type Cell,
  type Game,
} from "./engine";
import { readSave, writeSave, type Save } from "./save";
import { sweetArt, blockArt } from "./art";
const stored = readSave();
let game: Game = stored?.game ?? createGame(),
  unlocked = stored?.unlocked ?? 0,
  sound = stored?.sound ?? false;
let selected: number | null = null,
  focus = 0,
  busy = false,
  hint: number[] = [],
  view: Cell[] = game.board,
  toast = "A fresh batch of possibilities.",
  dialog: "map" | "help" | null = null;
let audio: AudioContext | undefined;
let gesture: { index: number; x: number; y: number } | null = null;
const app = document.querySelector<HTMLDivElement>("#app")!;
const icons: Record<string, string> = {
  rose: "♥",
  mint: "▣",
  citrus: "●",
  berry: "⬟",
  lemon: "◆",
  glaze: "▧",
  meringue: "▤",
  "specials made": "✦",
};
function save(): void {
  if (!writeSave({ version: 1, unlocked, game, sound } satisfies Save))
    toast += " Saving unavailable in this browser.";
}
function ping(invalid = false): void {
  if (!sound) return;
  try {
    audio ??= new AudioContext();
    void audio.resume();
    const o = audio.createOscillator(),
      v = audio.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(invalid ? 180 : 520, audio.currentTime);
    o.frequency.exponentialRampToValueAtTime(
      invalid ? 130 : 900,
      audio.currentTime + 0.12,
    );
    v.gain.setValueAtTime(0.045, audio.currentTime);
    v.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.19);
    o.connect(v).connect(audio.destination);
    o.start();
    o.stop(audio.currentTime + 0.2);
  } catch {
    /* Audio is optional. */
  }
}
function render(hits: number[] = []): void {
  const stage = STAGES[game.level];
  const positions = new Map<string, DOMRect>();
  document.querySelectorAll<HTMLElement>("[data-piece]").forEach((el) => {
    positions.set(el.dataset.piece!, el.getBoundingClientRect());
  });
  const active = document.activeElement as HTMLElement | null;
  const activeCell = active?.dataset.cell;
  const activeId = active?.id;
  app.innerHTML = `
<header class="masthead"><a href="#" class="brand" aria-label="Bonbon Borough home"><span class="brand-mark">b<span>✦</span></span><span>BONBON<br><b>BOROUGH</b></span></a><nav><button id="map">The borough <span>↗</span></button><button id="help">How to play</button><button id="sound" aria-label="${sound ? "Mute" : "Enable"} sound" aria-pressed="${sound}">${sound ? "♪" : "♩"} <span>${sound ? "Sound on" : "Sound off"}</span></button></nav></header>
<main><section class="intro"><div class="eyebrow"><span></span> A LITTLE MATCH-THREE ADVENTURE</div><h1>Life’s a little<br><em>sweeter here.</em></h1><p>Swap a sweet. Start a cascade.<br>Make a little magic in Bonbon Borough.</p><div class="chapter"><span class="chapter-icon">${game.level + 1}</span><div><small>YOUR NEXT LITTLE ADVENTURE</small><strong>${stage.name}</strong><span>${stage.subtitle}</span></div></div><div class="mini-map" aria-label="Campaign progression">${STAGES.map((s, i) => `<button class="map-dot ${i === game.level ? "current" : ""} ${i < unlocked ? "done" : ""}" data-stage="${i}" ${i > unlocked ? "disabled" : ""} aria-label="Stage ${i + 1}: ${s.name}${i > unlocked ? ", locked" : ""}">${i > unlocked ? "·" : i < unlocked ? "✓" : i + 1}</button>`).join("<i></i>")}</div><p class="note">Six sweet stops. One lovely little journey.</p><div class="botanical" aria-hidden="true"><span>✧</span><i></i><b>❧</b></div></section>
<section class="play-area" aria-label="Game"><div class="game-top"><div><span class="eyebrow">STAGE ${String(game.level + 1).padStart(2, "0")} / 06</span><h2>${stage.name}</h2></div><button id="restart" aria-label="Restart stage" ${busy ? "disabled" : ""}>↻</button></div><div class="dashboard"><div class="moves"><strong id="moves">${game.moves}</strong><span>MOVES LEFT</span></div><div class="goals">${objectiveProgress(
    game,
  )
    .map(
      (p) =>
        `<div class="goal"><span class="goal-icon ${p.label}">${icons[p.label]}</span><div><span class="goal-label">${p.label === "glaze" ? "Clear glaze" : p.label === "meringue" ? "Break meringue" : p.label === "specials made" ? "Make specials" : "Collect " + p.label}</span><strong>${Math.min(p.current, p.target)} <small>/ ${p.target}</small> ${p.current >= p.target ? "✓" : ""}</strong></div><progress max="${p.target}" value="${p.current}"></progress></div>`,
    )
    .join("")}</div></div>
<div class="board-wrap"><div class="board" role="grid" aria-label="Sweet board, eight rows and eight columns" aria-busy="${busy}">${view.map((c, i) => `<button type="button" role="gridcell" tabindex="${i === focus ? 0 : -1}" data-cell="${i}" ${c.sweet ? `data-piece="${c.sweet.id}"` : ""} aria-selected="${selected === i}" aria-label="Row ${Math.floor(i / 8) + 1}, column ${(i % 8) + 1}: ${c.block ? "meringue, " + c.block + " layers" : c.sweet?.special === "prism" ? "prism" : (c.sweet?.color ?? "empty") + " " + (c.sweet?.special ?? "sweet")}${c.glaze ? ", glaze " + c.glaze : ""}" class="cell ${c.glaze ? "glaze glaze-" + c.glaze : ""} ${selected === i ? "selected" : ""} ${hint.includes(i) ? "hint" : ""} ${hits.includes(i) ? "hit" : ""} ${c.block ? "block" : ""}">${c.block ? blockArt : c.sweet ? sweetArt(c.sweet) : ""}${c.block === 2 ? '<span class="layer-dot">2</span>' : ""}${c.glaze === 2 ? '<span class="glaze-dot">◆</span>' : ""}</button>`).join("")}</div>${game.status !== "playing" && !busy ? `<div class="result" role="dialog" aria-modal="true" aria-labelledby="result-title"><span class="result-flower">${game.status === "won" ? "✺" : "☁"}</span><span class="eyebrow">${game.status === "won" ? "OH, HOW SWEET!" : "A FRESH START?"}</span><h2 id="result-title">${game.status === "won" ? (game.level === 5 ? "Borough brilliant!" : "Beautifully done.") : "One more batch."}</h2><p>${game.status === "won" ? (game.level === 5 ? "You completed all six sweet stops." : "The next sweet stop is waiting.") : "A little planning makes a big difference."}</p><strong>${game.score.toLocaleString()} points</strong><button class="primary" id="continue">${game.status === "won" ? (game.level === 5 ? "Back to the borough" : "On to stage " + (game.level + 2) + " →") : "Try this stage again ↻"}</button></div>` : ""}</div>
<div class="board-footer"><span class="score">✦ <b>${game.score.toLocaleString()}</b> <small>POINTS</small></span><button id="hint" ${busy || game.status !== "playing" ? "disabled" : ""}>✧ A little hint</button></div><div class="status" role="status" aria-live="polite">${toast}</div><p class="control-note">Click two neighbors, or drag to swap. <span>Keyboard: arrows + Space.</span></p></section>
<aside class="recipe-card"><span class="eyebrow">A RECIPE FOR MAGIC</span><h3>Better together.</h3><div class="recipe"><div class="recipe-art">${sweetArt({ color: "rose", id: 9001 })}${sweetArt({ color: "rose", id: 9002, special: "row" })}</div><strong>Four in a row</strong><p>Make a stripe.<br>Clear a whole line.</p></div><div class="recipe"><div class="recipe-art">${sweetArt({ color: "mint", id: 9003, special: "parcel" })}</div><strong>A little T or L</strong><p>Make a parcel.<br>Two delightful pops.</p></div><div class="recipe"><div class="recipe-art">${sweetArt({ color: "berry", id: 9004, special: "prism" })}</div><strong>Five in a row</strong><p>Make a prism.<br>Clear a whole color.</p></div><div class="recipe-tip">✦<p>Swap two specials.<br>See something wonderful.</p></div></aside></main><footer>MADE FOR THE JOY OF A LITTLE BREAK <span>Original art & code · No purchases, just play.</span></footer>
${dialog ? modal() : ""}`;
  bind();
  if (busy && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.querySelectorAll<HTMLElement>("[data-piece]").forEach((el) => {
      const previous = positions.get(el.dataset.piece!);
      const current = el.getBoundingClientRect();
      const dx = previous ? previous.x - current.x : 0;
      const dy = previous ? previous.y - current.y : -current.height * 2;
      if (dx || dy)
        el.querySelector("svg")?.animate(
          [
            {
              transform: `translate(${dx}px, ${dy}px)`,
              opacity: previous ? 1 : 0,
            },
            { transform: "translate(0, 0)", opacity: 1 },
          ],
          { duration: 150, easing: "ease-out" },
        );
    });
  }
  const background = document.querySelector<HTMLElement>("main");
  const masthead = document.querySelector<HTMLElement>(".masthead");
  if (background) background.inert = dialog !== null;
  if (masthead) masthead.inert = dialog !== null;
  if (dialog) {
    const modal = document.querySelector<HTMLElement>(".modal")!;
    const previous = activeId ? document.getElementById(activeId) : null;
    (previous && modal.contains(previous)
      ? previous
      : document.getElementById("close")
    )?.focus({ preventScroll: true });
  } else if (activeCell !== undefined && game.status === "playing")
    document
      .querySelector<HTMLButtonElement>(`[data-cell="${focus}"]`)
      ?.focus({ preventScroll: true });
  else if (activeId && !dialog) {
    document.getElementById(activeId)?.focus({ preventScroll: true });
    if (activeId === "close")
      document
        .getElementById(game.status === "playing" ? "help" : "continue")
        ?.focus();
  }
}
function modal(): string {
  return `<div class="modal-backdrop"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><button id="close" class="close" aria-label="Close dialog">×</button><span class="eyebrow">BONBON BOROUGH</span><h2 id="modal-title">${dialog === "map" ? "Your sweet little journey." : "A little know-how."}</h2>${dialog === "map" ? `<div class="stage-list">${STAGES.map((s, i) => `<button data-stage="${i}" ${i > unlocked ? "disabled" : ""}><b>${i > unlocked ? "♧" : i < unlocked ? "✓" : i + 1}</b><span><strong>${s.name}</strong><small>${s.subtitle}</small></span><span>${i > unlocked ? "Locked" : "→"}</span></button>`).join("")}</div>` : `<p>Swap adjacent sweets to match three or more of the same color. A swap without a match returns for free.</p><p><b>Four in a line:</b> make a stripe in the direction of your swipe. <b>Five:</b> make a prism. <b>T / L:</b> make a parcel.</p><p>Match a stripe or parcel to activate it. Swap a prism with any color. Combine any two specials — no color match needed!</p><p><b>Combinations:</b> stripe + stripe clears a cross; stripe + parcel clears three rows and columns; two parcels pop a 5×5 area twice. Prism + stripe/parcel converts the partner color into that special. Two prisms clear the board.</p><p>Clear <b>glaze</b> by matching on it. Break <b>meringue</b> with adjacent matches or special blasts. A little diamond or “2” means two layers. Finish every goal before moves run out.</p><p>Click two neighbors or drag/swipe. Keyboard: arrows move focus, Space or Enter selects and swaps; Escape cancels. Hints and reshuffles are free. Progress saves automatically.</p><p class="fine">An original six-stage homage to classic match-three play. Traditional match/combine activation; no tap-to-activate, fish, purchases, or King assets.</p>`}</section></div>`;
}
function start(level: number): void {
  if (busy || level > unlocked) return;
  game = createGame(level);
  selected = null;
  hint = [];
  view = game.board;
  dialog = null;
  toast = "A fresh batch of possibilities.";
  save();
  render();
}
function choose(i: number): void {
  if (busy || game.status !== "playing" || dialog) return;
  focus = i;
  if (selected === null) {
    selected = i;
    hint = [];
    render();
    return;
  }
  if (selected === i) {
    selected = null;
    render();
    return;
  }
  if (adjacent(selected, i)) {
    const a = selected;
    selected = null;
    void play(a, i);
  } else {
    selected = i;
    render();
  }
}
const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
async function play(a: number, b: number): Promise<void> {
  if (busy) return;
  busy = true;
  hint = [];
  const result = attemptSwap(game, a, b);
  if (!result.valid) {
    const original = clone(game.board);
    view = clone(game.board);
    if (!view[a].block && !view[b].block)
      [view[a].sweet, view[b].sweet] = [view[b].sweet, view[a].sweet];
    toast = result.message;
    ping(true);
    render([a, b]);
    await wait(220);
    view = original;
    busy = false;
    render();
    document
      .querySelector<HTMLButtonElement>(`[data-cell="${focus}"]`)
      ?.focus({ preventScroll: true });
    return;
  }
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  game.moves = result.game.moves;
  for (const frame of result.frames) {
    view = frame.board;
    toast = frame.label;
    game.score = frame.score;
    render(frame.hits);
    if (frame.hits.length) ping();
    await wait(reduced ? 35 : frame.hits.length ? 230 : 150);
  }
  game = result.game;
  view = game.board;
  toast = result.message;
  busy = false;
  if (game.status === "won")
    unlocked = Math.max(unlocked, Math.min(5, game.level + 1));
  save();
  render();
  if (game.status !== "playing")
    document.querySelector<HTMLButtonElement>("#continue")?.focus();
  else
    document
      .querySelector<HTMLButtonElement>(`[data-cell="${focus}"]`)
      ?.focus({ preventScroll: true });
}
function bind(): void {
  document.querySelector("#map")?.addEventListener("click", () => {
    if (!busy) {
      dialog = "map";
      render();
      document.querySelector<HTMLButtonElement>("#close")?.focus();
    }
  });
  document.querySelector(".brand")?.addEventListener("click", (e) => {
    e.preventDefault();
    if (!busy) {
      dialog = "map";
      render();
    }
  });
  document.querySelector("#help")?.addEventListener("click", () => {
    dialog = "help";
    render();
    document.querySelector<HTMLButtonElement>("#close")?.focus();
  });
  document.querySelector("#close")?.addEventListener("click", () => {
    dialog = null;
    render();
  });
  document.querySelector("#sound")?.addEventListener("click", () => {
    sound = !sound;
    if (!busy) save();
    ping();
    render();
  });
  document
    .querySelector("#restart")
    ?.addEventListener("click", () => start(game.level));
  document.querySelector("#continue")?.addEventListener("click", () => {
    if (game.status === "won" && game.level === 5) {
      dialog = "map";
      render();
    } else start(game.status === "won" ? game.level + 1 : game.level);
  });
  document.querySelector("#hint")?.addEventListener("click", () => {
    hint = availableMoves(game)[0] ?? [];
    toast = "These two could be lovely together.";
    render();
  });
  document
    .querySelectorAll<HTMLButtonElement>("[data-stage]")
    .forEach((b) =>
      b.addEventListener("click", () => start(Number(b.dataset.stage))),
    );
  document.querySelectorAll<HTMLButtonElement>("[data-cell]").forEach((b) => {
    const i = Number(b.dataset.cell);
    b.addEventListener("click", () => {
      if (!gesture) choose(i);
    });
    b.addEventListener("pointerdown", (e) => {
      if (!busy && !dialog) {
        gesture = { index: i, x: e.clientX, y: e.clientY };
        b.setPointerCapture(e.pointerId);
      }
    });
    b.addEventListener("pointerup", (e) => {
      if (!gesture) return;
      const { index, x, y } = gesture;
      gesture = null;
      const dx = e.clientX - x,
        dy = e.clientY - y;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return;
      const target =
        index +
        (Math.abs(dx) > Math.abs(dy) ? Math.sign(dx) : Math.sign(dy) * 8);
      if (adjacent(index, target)) {
        selected = null;
        void play(index, target);
      }
      e.preventDefault();
      suppressClick = true;
    });
    b.addEventListener("pointercancel", () => {
      gesture = null;
    });
    b.addEventListener("keydown", (e) => {
      if (dialog || busy) return;
      if (e.key === "Escape") {
        selected = null;
        render();
        return;
      }
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        choose(i);
        document
          .querySelector<HTMLButtonElement>(`[data-cell="${focus}"]`)
          ?.focus();
        return;
      }
      const delta: Record<string, number> = {
        ArrowLeft: -1,
        ArrowRight: 1,
        ArrowUp: -8,
        ArrowDown: 8,
      };
      if (delta[e.key]) {
        e.preventDefault();
        const next = i + delta[e.key];
        if (adjacent(i, next)) {
          focus = next;
          document
            .querySelector<HTMLButtonElement>(`[data-cell="${next}"]`)
            ?.focus();
        }
      }
    });
  });
}
let suppressClick = false;
document.addEventListener(
  "click",
  (e) => {
    if (suppressClick) {
      suppressClick = false;
      e.stopImmediatePropagation();
    }
  },
  true,
);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && dialog) {
    dialog = null;
    render();
  }
  if (e.key === "Tab" && document.querySelector('[aria-modal="true"]')) {
    const scope =
      document.querySelector('.modal[aria-modal="true"]') ??
      document.querySelector('[aria-modal="true"]')!;
    const buttons = [
      ...scope.querySelectorAll<HTMLButtonElement>("button:not(:disabled)"),
    ];
    const first = buttons[0],
      last = buttons.at(-1);
    if (!scope.contains(document.activeElement)) {
      e.preventDefault();
      (e.shiftKey ? last : first)?.focus();
    } else if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last?.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first?.focus();
    }
  }
});
save();
render();

if (game.status !== "playing")
  document.querySelector<HTMLButtonElement>("#continue")?.focus();
