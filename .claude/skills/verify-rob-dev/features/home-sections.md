# Home sections and nav

The home page shows Rob's Identity column on the left and three sections on the right, About, Work and Experience, each rising into view as it scrolls in. Work opens with the Stack as a row of chips above the Project cards: pressing a chip dims the Projects that don't use it, and pointing at a Project dims the chips it doesn't use. A Sections nav in the Identity column jumps to each section and marks the section being read.

## Sub-features

- `home-sections` the three sections render, in order, each with its h2.
- `home-nav-jump` a nav link scrolls to its section and updates the URL hash.
- `home-nav-current` the nav marks exactly one section as current.
- `home-narrow` below 860px the layout is one column and the nav is hidden.
- `work-highlight` a Stack chip toggles (`aria-pressed`) and dims the Projects that don't use it until pressed again or Esc; hovering or focusing a Project card dims the chips it doesn't use. Dimmed cards stay reachable.

## How to get to it (user POV)

- Open `/`.
- Choose `About`, `Work` or `Experience` in the `Sections` nav.
- Open `/#experience` (or another section id) directly.
- In Work, press a chip in the `Stack` list, or hover a Project card.

## Driving it with verify.mjs

Preconditions:

- `doctor` prints `OK`.

- **Whole page.** Run `verify.mjs shot --name home --full --run home-sections`. The ARIA snapshot lists h2s `About`, `Work`, `Experience` in that order and a navigation named `Sections`.
- **One section.** Run `verify.mjs shot --section work --name work --run home-sections`. The PNG shows only that section: the Stack chips, then the Project cards.
- **Phone.** Run `verify.mjs shot --name home-375 --full --width 375 --height 812 --theme light --run home-sections`. The JSON shows `horizontalOverflowPx: 0`; the ARIA snapshot has no `Sections` navigation.
- **Nav jump.** Not in the helper: run `npx playwright test -g "section nav scrolls to a section"` against a fresh build, or script a click on the `Experience` link in the `Sections` navigation and check the URL ends `#experience` and that link has `aria-current="location"`.
- **Highlight.** Not in the helper: run `npx playwright test -g "Stack chip|pointing at a Project"` against a fresh build, or script a click on the `React` button in the `Stack` list and check it has `aria-pressed="true"` and the `devflow` card has `data-dimmed`.

## Gotchas

- Sections fade up on scroll. The helper turns on reduced motion so they're visible at once; with `--motion`, scroll before capturing or the section is blank. Content peeking into the bottom tenth of the window hasn't risen yet.
- The Identity column is sticky on desktop, so a full-page PNG shows it only at the top.
- Two lists in Work have similar jobs: `Stack` is the chips, and each card's pills are `Built with`.
