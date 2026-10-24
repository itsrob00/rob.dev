---
name: verify-rob-dev
description: Drive rob.dev (Rob's portfolio, a Next.js static export) in a real Chromium the way a visitor does, and capture screenshot, ARIA and console evidence. Use to prove a change to the home page, a Project page, the Résumé or the theme works in the built site, not only in tests.
---

# Verify rob.dev

rob.dev is fully static: `npm run build` writes every route to `out/`, and visitors only ever get those files. So verification drives the built export, served locally, never `next dev`, whose HMR and dev overlay don't exist in production.

Everything goes through one helper. Run it from the checkout's root (a worktree's root works too; state is per checkout):

```bash
node .claude/skills/verify-rob-dev/verify.mjs <launch|doctor|shot|stop> [options]
```

It imports `@playwright/test` from the repo's own `node_modules`, so run `npm ci` first in a fresh checkout or worktree. Chromium must be installed once per machine: `npx playwright install chromium`.

## Launch

```bash
node .claude/skills/verify-rob-dev/verify.mjs launch --port 3500
```

Builds (`npm run build`, which also runs the Résumé fingerprint check as `prebuild`), then serves `out/` with the repo's `serve` on the port, detached. Ready when it prints `READY http://localhost:3500 pid=<pid> head=<sha>`. `--no-build` reuses an existing `out/`.

Ports: avoid 3100 (the Playwright smoke suite's, and it reuses whatever answers there), and 3200/3300/3400 (`.claude/launch.json` dev servers). It refuses a port that already answers, and a second launch from the same checkout while one is up. Two checkouts can each run one instance on different ports.

A build fails when the Résumé fingerprint is stale (an edit to anything the Résumé is built from). Only Rob's machine re-renders the PDF (`npm run resume:pdf`); report that rather than working around it.

## Doctor

```bash
node .claude/skills/verify-rob-dev/verify.mjs doctor
```

Read-only. `OK ...` means the pid this checkout started is alive, the URL serves rob.dev's home page (`<h1>Rob</h1>`), the build is from the current `HEAD`, and no tracked file was edited after the build. Anything else prints `FAIL <reasons>` and exits 1: `stop`, then `launch` again. Run it before every drive session and whenever a result looks wrong.

## Drive

```bash
node .claude/skills/verify-rob-dev/verify.mjs shot [route] --name <file> [--section <id>] [--theme dark|light] [--width 1280] [--height 900] [--run <id>] [--motion] [--full]
```

One call is one visitor: a fresh Chromium context at the given viewport, the theme set the way the site's toggle stores it (`localStorage.theme`; dark is the default), reduced motion on so scroll-in animations have settled (`--motion` turns it back off). Give the route without its leading slash (`resume`, `projects/devflow`) and omit it for home: Git Bash on Windows rewrites a bare `/...` argument into a Windows path, and the helper refuses one it sees. It opens the route, scrolls the `#<section>` element into view and captures that element (or the viewport, or with `--full` the whole page).

It fails loud (exit 1, after writing the evidence) when the page scrolls sideways, when the rendered `<html data-theme>` isn't the requested theme, or when the console logs an error. The known Next 16.4 static-export prefetch 404s (`__next.<seg>.__PAGE__.txt`) are ignored, and the Vercel Analytics and Speed Insights scripts (`/_vercel/**/script.js`, which only Vercel serves) are answered with an empty script, both as the e2e suite does.

Stable handles: routes home (no argument), `projects/devflow`, `projects/exolab-redesign`, `resume`, any unknown path for the 404; home section ids `about`, `work`, `experience`; the `Sections` nav; the theme toggle's accessible name `Switch to light theme` / `Switch to dark theme`. Phone width is `--width 375 --height 812`; the layout collapses to one column at 860px.

For an interaction the helper doesn't cover (clicking the nav, toggling the theme, downloading the PDF), write a short Playwright script that reads the URL from `.verify/state.json`, uses role-based locators like `e2e/smoke.spec.ts` does, and saves its own screenshot under `.verify/evidence/<run>/`. Check `e2e/smoke.spec.ts` first: most user paths already have a test there, and `npx playwright test -g "<name>"` against a fresh build is valid proof too.

## Evidence

Each `shot` writes three files to `.verify/evidence/<run>/` (gitignored; `--run` defaults to `adhoc`):

- `<name>.png`: what the visitor sees.
- `<name>.aria.txt`: the accessibility tree of the same element, which is what proves headings, lists and text, since a screenshot can't be grepped.
- `<name>.json`: route, section, theme, viewport, sideways overflow in px, console errors, the built `HEAD`, and the time.

A proof of a visual change is at least: the changed section at desktop width in dark, and at 375px in light, each with its ARIA snapshot. Compare against `main` by launching from a checkout of `main` into a different `--run`. Prove the real visitor path: the built route, never a component in isolation or a `?variant=` prototype.

## Cleanup

```bash
node .claude/skills/verify-rob-dev/verify.mjs stop
```

Kills the pid this checkout's `launch` started (never by process name) and removes `.verify/state.json`. Evidence in `.verify/evidence/` is kept; delete a run's folder by hand when it's no longer needed.

## Feature map

[`features/README.md`](features/README.md) lists the user-facing features and how to prove each one. Keep it in step with the site.
