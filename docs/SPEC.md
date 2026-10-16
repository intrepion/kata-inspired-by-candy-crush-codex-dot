# Bonbon Borough scope and settled design
The user selected recommended defaults with no optional questions. Grill-with-docs design frontier resolved from that authorization: original pastel confectionery town, 8×8 board, five colors, six ordered levels, classic adjacent swaps, no tap activation, no purchases/lives/timers. Scope is Candy Crush Saga-style rules, not Soda/Jelly Saga.

## Public test seams
The user explicitly requests swap, match, special, cascade, objective/move, dead-board and save tests. Test public engine createGame/attemptSwap/resolve/availableMoves and save encode/decode, plus normal browser controls. Seeded RNG makes replay evidence reproducible.

## Rules
Invalid and blocked swaps reverse and spend no move. Four line -> stripe oriented with swap; five line -> prism; intersecting runs -> parcel. Highest priority five > intersect > four; creation at destination/source if matched, otherwise intersection/middle. Specials activate when cleared or combined; chain once per pulse. Parcel has delayed second pulse after gravity. A special created at a matched tile still damages underlying glaze.
All six special pairs supported independent of color. Prism+normal clears its color. Prism hit chooses seeded color. Jelly analogue (glaze) loses one layer per hit. Frosting analogue (meringue) occupies a fixed tile, is unswappable, loses a layer to adjacent match or direct blast, once per pulse. Gravity runs within column segments bounded by meringue. Automatic no-move shuffle preserves special inventory and blockers/glaze, spends no move.

## Campaign
Six authored seeds/layouts teach collection, glaze, meringue, line specials, combinations, and mixed mastery. Each has a move limit and meaningful completion condition. Unlimited retry, level unlock after win, replay completed stages. Persist current settled board, seed, remaining moves, score, objective counts and unlocked levels under a unique versioned key. Reject malformed saves; unavailable storage leaves session playable.

## UI
Click/tap then neighbor, drag/swipe, keyboard arrows + Space/Enter selection. Escape cancels. Board locks while resolving. Show objectives, moves, score, hint, restart, map, sound toggle, tutorial, clear win/loss dialog. Original SVG/CSS candy art and synthesized opt-in audio. Responsive and reduced-motion aware.
