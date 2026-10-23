# Experience

The home page's last section shows Rob's time at each employer as one tenure: the employer's name, Rob's title there and the total years, then the Engagements (client work) hanging off a single vertical rail, newest first, the ongoing one marked with a green dot. Each Engagement shows its years and client, its name and Rob's role on it, and a one-line description. The Résumé shows the same records in more detail.

## Sub-features

- `experience-tenure` the employer heading (h3) with title and total years beneath it.
- `experience-rail` the Engagements as one list (h4 each) joined by one line, a dot per Engagement, the ongoing one in the accent colour.
- `experience-compact` descriptions only: no tech lists or bullets, which are the Résumé's.

## How to get to it (user POV)

- Scroll to the end of `/`.
- Choose `Experience` in the `Sections` nav.
- Open `/#experience`.

## Driving it with verify.mjs

Preconditions:

- `doctor` prints `OK`.

- **Desktop, dark.** Run `verify.mjs shot --section experience --name experience-desktop-dark --run experience`. The ARIA snapshot has heading level 3 `Exolab S.r.l., Rome`, the text `Front-end Software Engineer · 2023 – now`, and a list of four level-4 headings starting `PCO · Front-end Tech Lead`. The PNG shows one vertical line with four dots, the first green.
- **Phone, light.** Run `verify.mjs shot --section experience --name experience-375-light --width 375 --height 812 --theme light --run experience`. The JSON shows `theme: "light"` and `horizontalOverflowPx: 0`; the PNG shows the rail still joining every Engagement.
- **Compact.** In either ARIA snapshot, no text matches `Redux Toolkit` or `Sole owner`.

## Gotchas

- The green dot follows the record (an Engagement with no end date), not list position. A record change can move it or add a second one.
- `2025 · Sisal, via Reply` appears twice by design (two Sisal Engagements in 2025).
