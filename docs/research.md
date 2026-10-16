# Gameplay research and bounded rules

Research date: 2026-10-16. This is an original game inspired by the traditional **Candy Crush Saga** swap/match loop. It is not a reproduction of a particular King build. No King code, assets, level layouts, sounds, characters, or branding are reused.

## Primary references

- [King: controls](https://candycrush.zendesk.com/hc/en-us/articles/360000750278-Controls-how-to-switch-and-match-candies): drag one candy into its neighbor to make a horizontal/vertical match; removed pieces leave room for falling pieces; reach the objective before moves expire.
- [King: creating and combining special candies](https://candycrush.zendesk.com/hc/en-us/articles/211939685-Creating-and-combining-Special-Candies): four in a line makes a stripe; five in a line makes a color bomb; a five-piece T/L makes a wrapped piece. Stripes clear a complete line, wrapped pieces affect their 3×3 neighborhood, and color bombs target a color. The page confirms stripe/wrap, color/stripe, color/wrap and double-color combinations, but does not specify every geometric or timing detail.
- [King: blockers](https://candycrush.zendesk.com/hc/en-us/articles/360000754717-Which-Blockers-can-I-find-in-the-game): frosting stays in place and is damaged by neighboring matches or special blasts; jelly sits beneath pieces and is cleared by matching directly over it. Blockers can have several layers.
- [King: new tap/swipe special controls](https://candycrush.zendesk.com/hc/en-us/articles/36873468198429-New-ways-to-tap-and-swipe-Special-Candies): tap-to-activate is a limited-group experiment. This project deliberately uses traditional match/combine activation instead.

## Detailed combination cross-checks

[Lifewire's gameplay guide](https://www.lifewire.com/best-candy-crush-cheats-4171581) corroborates six combinations: stripe/stripe clears a cross; stripe/wrap clears three rows and columns; color/stripe converts the partner color into activated stripes; color/wrap converts it into activated wraps; double color clears the board; double wrap has a delayed repeat. Its stated double-wrap footprint conflicts with other references, so that size is not adopted.

[Italian gameplay summary](https://it.wikipedia.org/wiki/Candy_Crush_Saga) explicitly describes an ordinary wrapped piece blasting its eight neighbors, falling through the cleared space, and exploding again. [Chinese gameplay summary](https://zh.wikipedia.org/wiki/%E7%B3%96%E6%9E%9C%E5%82%B3%E5%A5%87) specifies the classic double-wrap combination as two 5×5 pulses and corroborates the three-row/three-column cross. These community-edited references supplement, rather than replace, King's broader official descriptions.

[Spanish gameplay summary](https://es.wikipedia.org/wiki/Candy_Crush_Saga) distinguishes the historical color/wrap behavior (clear its color, settle, then clear another color) from the modern behavior (convert the partner color to wraps and activate them). The modern conversion rule is selected. It also documents swipe-direction stripe orientation and five-in-line priority when patterns overlap.

[King Community report on supercharged wraps](https://community.king.com/en/candy-crush-saga/discussion/449508/super-charged-wrapped-candies) describes a separate temporary feature with enlarged second pulses and upgraded combinations. Those supercharged dimensions are excluded. This is a player report hosted by King, not a formal specification.

## Implementation contract

1. Only orthogonally adjacent pieces swap. An ordinary swap must produce a match containing a swapped piece. Otherwise it reverses and consumes no move. Adjacent special/special combinations and color/ordinary swaps are valid without a three-piece run. [Independent interface analysis](https://fayejstover.medium.com/game-breakdown-candy-crush-1d89f4f930f1) corroborates non-penalized invalid moves.
2. Runs are horizontal/vertical and at least three long. Resolve all simultaneous matches, then gravity/refill and repeat cascades within that one move. Freeze player input until resolution finishes.
3. A direct four-match stripe follows the swipe axis; cascade stripes use a documented deterministic fallback. Five-in-line has priority over a crossing T/L; otherwise crossing horizontal/vertical runs create a wrap. Direct special creation favors the moved piece's destination; cascade placement is deterministic. These tie-breaks are project rules, not claims of full King parity.
4. An ordinary wrap has two 3×3 pulses. Preserve its identity after the first pulse, apply gravity, then fire the second at its new location. A second pulse is not a second player move. Double-wrap uses enlarged 5×5 pulses around the combination position and repeats after gravity. The bounded engine must document its anchor rule rather than claiming exact proprietary animation parity.
5. The six special pairs are supported regardless of their colors: stripe/stripe → one row plus one column; stripe/wrap → three rows plus three columns; wrap/wrap → two 5×5 pulses; color/stripe → all partner-color pieces become stripes and fire; color/wrap → all partner-color pieces become wraps and fire twice; color/color → board-wide clear. Combination effects can trigger other specials. Edge footprints are clipped to the board.
6. Frosting and jelly use one damage per affected cell per resolution pulse. A later cascade or second wrapped pulse may damage another layer. Adjacent damage is orthogonal. Explicit layer accounting avoids accidental multiple damage from overlapping cells in one match.
7. Objectives and all cascades finish before testing win/loss, so a final-move objective completion wins. Dead settled boards reshuffle without costing a move. Refill and reshuffle are deterministic from a seed for reproducible tests.

## Scope and deliberate differences

The finite original campaign uses move limits, color collection, layered jelly, and stationary layered frosting. It excludes purchases, lives timers, paid continues, boosters, events, fish, ingredients/dragons, chocolate spread, portals, irregular board geometry, and thousands of King levels. Current King's special-candy help includes square-created fish; this classic three-special subset intentionally does not. Audio and visual effects are original. Scoring, deterministic generation, level budgets, special placement tie-breaks, cascade stripe orientation, combination anchors, reshuffle behavior, and save format are project-defined. Source verification establishes recognizable rules, not exhaustive version equivalence.
