# rob.dev verification map

The maintained list of what a visitor can do on rob.dev and how to prove each one in the built site. Read this index, then use the matching feature file as the recipe.

## Baseline preconditions

- Dependencies installed (`npm ci`) in the checkout being verified, and Chromium installed (`npx playwright install chromium`).
- `node .claude/skills/verify-rob-dev/verify.mjs launch --port 3500` printed `READY`, and `doctor` prints `OK`.
- Never drive an instance this checkout didn't launch, and never the Playwright suite's port 3100.

## Driving conventions

- Drive built routes through `verify.mjs shot`, one fresh visitor per call. Interactions the helper doesn't cover go in a short Playwright script using role locators, as in `e2e/smoke.spec.ts`.
- Prefer section ids, routes, ARIA roles and accessible names over CSS classes or coordinates: class names are CSS-module hashes.
- The site opens dark whatever the OS asks for. Light is the visitor's choice, stored by the theme toggle.

## Proof and skip reporting

- A UI proof is a screenshot plus the ARIA snapshot of the same element, with the `.json` record showing no sideways overflow and no console errors.
- Cover desktop (1280 × 900) dark and phone (375 × 812) light for any layout change.
- Name the feature id and route with every artifact (`--run <feature-id>`).
- If a path can't be reached (build fails on a stale Résumé fingerprint, Chromium missing), report the command and the unmet precondition. Don't report it verified through another path.

## Feature entry contract

Each feature file starts with an H1 and one paragraph on what the visitor sees, then exactly four H2s in order: `Sub-features`, `How to get to it (user POV)`, `Driving it with verify.mjs`, `Gotchas`. User paths, handles and observable proof only; no implementation details.

## Features

- [Home sections and nav](./home-sections.md): About, Stack, Selected Work and Experience, the section nav and its current-section marker.
- [Experience](./experience.md): Rob's tenure at each employer, with its Engagements on one rail.
- [Project page](./project-page.md): a Selected Work card opens the Project's write-up, ending with its Repo preview.
- [Résumé](./resume.md): the printable Résumé page and its PDF download.
- [Theme](./theme.md): dark by default, a toggle to light that persists.
