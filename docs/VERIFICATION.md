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

Native Mac browser acceptance is **pending parent ownership handoff**. The parent reserved the shared native browser/screen/input for Mario Paint, then California Games. This task has not used those surfaces or claimed native acceptance. Native acceptance must demonstrate invalid/valid swaps, a cascade, special creation/use, level completion, loss/retry, progression and reload through normal controls. Windows browsers, Safari, physical mobile devices, touch hardware, audible output and screen readers remain unverified.

## Preview and publication

Production preview: http://127.0.0.1:5226/ — detached Node process, loopback only, strict reserved port. PID/log in ignored .local/. Existing previews and saves remain untouched. Public GitHub repository publication is authorized; no public website deployment or account/security settings changes.
