# Project page

Each Selected Work card on the home page opens that Project's own page: a write-up with its stack, a link back home, and at the end a Repo preview card that opens the repo on GitHub in a new tab.

## Sub-features

- `project-open` a Selected Work card opens `/projects/<slug>`.
- `project-back` the page links back home.
- `project-repo-preview` the page ends with a Repo preview linking to GitHub in a new tab.

## How to get to it (user POV)

- Choose the `devflow` card in Selected Work on `/`.
- Open `/projects/devflow` directly.

## Driving it with verify.mjs

Preconditions:

- `doctor` prints `OK`.

- **Page.** Run `verify.mjs shot projects/devflow --name devflow --full --run project-page`. The ARIA snapshot has a level-1 heading starting `devflow` and a link back home.
- **Phone.** Run `verify.mjs shot projects/devflow --name devflow-375 --full --width 375 --height 812 --theme light --run project-page`. `horizontalOverflowPx: 0`.
- **Open from home and the Repo preview.** Not in the helper: run `npx playwright test -g "Selected Work card opens|Repo preview"` against a fresh build.

## Gotchas

- Project pages animate in with a shared-title transition from the card; a direct visit skips it.
