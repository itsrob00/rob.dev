# Home sections and nav

The home page shows Rob's Identity column on the left and four sections on the right, About, Stack, Selected Work and Experience, each rising into view as it scrolls in. A Sections nav in the Identity column jumps to each one and marks the section being read.

## Sub-features

- `home-sections` the four sections render, in order, each with its h2.
- `home-nav-jump` a nav link scrolls to its section and updates the URL hash.
- `home-nav-current` the nav marks exactly one section as current.
- `home-narrow` below 860px the layout is one column and the nav is hidden.

## How to get to it (user POV)

- Open `/`.
- Choose `About`, `Stack`, `Selected Work` or `Experience` in the `Sections` nav.
- Open `/#experience` (or another section id) directly.

## Driving it with verify.mjs

Preconditions:

- `doctor` prints `OK`.

- **Whole page.** Run `verify.mjs shot --name home --full --run home-sections`. The ARIA snapshot lists h2s `About`, `Stack`, `Selected Work`, `Experience` in that order and a navigation named `Sections`.
- **One section.** Run `verify.mjs shot --section stack --name stack --run home-sections`. The PNG shows only that section.
- **Phone.** Run `verify.mjs shot --name home-375 --full --width 375 --height 812 --theme light --run home-sections`. The JSON shows `horizontalOverflowPx: 0`; the ARIA snapshot has no `Sections` navigation.
- **Nav jump.** Not in the helper: run `npx playwright test -g "section nav scrolls to a section"` against a fresh build, or script a click on the `Experience` link in the `Sections` navigation and check the URL ends `#experience` and that link has `aria-current="location"`.

## Gotchas

- Sections fade up on scroll. The helper turns on reduced motion so they're visible at once; with `--motion`, scroll before capturing or the section is blank.
- The Identity column is sticky on desktop, so a full-page PNG shows it only at the top.
