# Project page

Each Work card on the home page opens that Project's own page: a write-up with what it's built with and a link back home. A Project a visitor can open also has its Repository or Live site links and, at the end, a Repo preview card that opens the repo on GitHub in a new tab. One that isn't public yet (Exolab redesign) has neither.

## Sub-features

- `project-open` a Work card opens `/projects/<slug>`.
- `project-back` the page links back home.
- `project-repo-preview` the page ends with a Repo preview linking to GitHub in a new tab.
- `project-not-public` a Project with no link shows no Repository, Live site or Repo preview links.

## How to get to it (user POV)

- Choose the `devflow` or `Exolab redesign` card in Work on `/`.
- Open `/projects/devflow` or `/projects/exolab-redesign` directly.

## Driving it with verify.mjs

Preconditions:

- `doctor` prints `OK`.

- **Page.** Run `verify.mjs shot projects/devflow --name devflow --full --run project-page`. The ARIA snapshot has a level-1 heading starting `devflow` and a link back home.
- **Page that isn't public yet.** Run `verify.mjs shot projects/exolab-redesign --name exolab --full --run project-page`. The ARIA snapshot has a level-1 heading `Exolab redesign`, the unofficial-concept line, and no link named `Repository ↗` or ending `on GitHub`.
- **Phone.** Run `verify.mjs shot projects/devflow --name devflow-375 --full --width 375 --height 812 --theme light --run project-page`. `horizontalOverflowPx: 0`.
- **Open from home and the Repo preview.** Not in the helper: run `npx playwright test -g "Work card opens|Repo preview|Exolab's page"` against a fresh build.

## Gotchas

- Project pages animate in with a shared-title transition from the card; a direct visit skips it.
