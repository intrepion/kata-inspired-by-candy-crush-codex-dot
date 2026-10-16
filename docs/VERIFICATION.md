# Verification record

## Automated behavior

- Strict TypeScript across application, unit tests, browser tests and scripts; production build succeeds.
- 47 engine/save tests: invalid immutable swaps, adjacency, reproducible stage starts, runs, 4/5/T/L special recipes, swipe-axis stripes, special chaining, six combination families, edge clipping, unique-color prism partners in both positions/orders, wrapped identity following gravity, direct/adjacent blocker distinction, glaze, blocked gravity, free dead-board shuffle preserving inventory, cascade accounting, final-move win/loss, restart, defensive saves and deterministic continuation.
- Isolated headless Chromium tests use normal click, keyboard and drag controls. They verify invalid reversal without a move, cascades and special creation during campaign play, win, progression, settled save reload, restart, loss/retry, help, hints, focus and mobile viewport fit. Full six-stage campaign completes using generated legal paths without injecting game state. Unrelated save sentinel survives.
- Desktop 1440×1000 and mobile 390×844 screenshots visually inspected. Original sweets are distinct in shape and color; board and HUD fit both viewports.
- `npm run simulate` generates docs/campaign-simulation.json through public engine operations. This is simulation-only evidence; it is neither native play nor a human difficulty assessment.

## Independent reviews and fixes

Separate code/standards and fidelity reviewers inspected the complete new implementation against AGENTS.md, docs/SPEC.md and research. Findings fixed:

1. Unique-color prism partners must still activate at the swapped position. Partner retained for conversion; regressions include stripe/column/parcel and both swap orders.
2. Special blasts must not damage meringue outside their footprints through adjacency. Only original match cells contribute adjacent damage; regression fixtures distinguish direct blasts and neighboring matches.
3. Animation renders must retain keyboard focus. Focus restored across frame renders and at valid/invalid completion; browser test asserts focus after a full move.
4. Foreground help/map dialogs must trap focus ahead of an underlying result dialog. Background is inert and focus returns when dismissed; terminal reload focuses Continue. Modal focus also survives active animation and brand/map entry.

The reviews also confirmed dedicated save isolation, finite cascade/shuffle guards, creation precedence and final-move win precedence. No unresolved high/medium code finding remains after regression checks.

## Platform and native acceptance

Local automated execution: connected Mac, isolated headless Chromium. CI: Linux/Windows/macOS Node checks and Linux Chromium; exact final SHA/run evidence belongs in the final handoff.

Native Mac Chrome acceptance **passed on 2026-10-16**, after exclusive UI ownership was explicitly granted. All actions used normal visible click and keyboard controls; no game-state injection or storage edits were used.

- Invalid r1c1/r1c2 swap reversed; the HUD remained at 16 moves.
- Valid r2c6/r2c7 swap spent one move and created a row stripe, which fell to r4c7.
- Keyboard Space/ArrowRight/Space swapped r2c4/r2c5 and produced two matches in one move. Focus remained on the board.
- r3c5/r4c5 activated the stripe, visibly cleared its row, produced three matches in one move, and created column stripes and a parcel.
- r7c5/r8c5 completed Sugar Square: rose 12/12, mint 12/12, 12 moves remaining, 2,820 points. The stage-two progression control unlocked Glaze Gardens.
- A normal hinted stage-two move left 22 moves, glaze 3/18 and 780 points. Browser reload preserved the entire board's 64 visible cell descriptions, stage, moves and objectives.
- Replaying stage one and using 16 normal hinted swaps reached a loss at zero moves with mint 9/12. Try this stage again restored the initial board, 16 moves and zero objectives/score while retaining stage-two unlock.

[Native win](images/native-win.jpg), [native loss](images/native-loss.jpg), and [native reload](images/native-reload.jpg) screenshots record the visible results. No defects were discovered. Existing other-game tabs and saves were not changed. Exclusive native UI ownership was released immediately after acceptance.

Native acceptance covers Mac Chrome click/keyboard input. Native drag/touch hardware, Windows browsers, Safari, physical mobile devices, audible output and screen readers remain unverified. Isolated headless tests separately cover drag controls, mobile viewport fit and all six stages. Engine simulations separately cover exhaustive fixtures and combination edge cases.

## Preview and publication

Production preview: http://127.0.0.1:5226/ — detached Node process, loopback only, strict reserved port. PID/log in ignored .local/. Existing previews and saves remain untouched. Public GitHub repository publication is authorized; no public website deployment or account/security settings changes.

## Cross-platform CI correction

The initial Windows CI run passed types/tests but flagged every formatted text file after checkout converted LF to CRLF. Added .gitattributes to retain LF for text on all platforms, while keeping PNGs binary. No gameplay behavior changed. Final handoff reports only the final commit's completed CI status.
