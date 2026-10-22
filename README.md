# itsrob.dev

My personal site: who I am, what I've built and how I work. It lives at [itsrob.dev](https://itsrob.dev).

## Stack

- Next.js 16 (App Router, Turbopack) with React 19, exported as a fully static site (`output: 'export'`)
- TypeScript in strict mode
- ESLint and Prettier, Vitest for unit tests, Playwright for the smoke test
- Hosted on Vercel

Node 24 (see `.nvmrc`) and npm.

## Scripts

| Script                  | What it does                                                     |
| ----------------------- | ---------------------------------------------------------------- |
| `npm run dev`           | Start the dev server                                             |
| `npm run build`         | Build the static site into `out/`                                |
| `npm run preview`       | Serve `out/` locally                                             |
| `npm run lint`          | ESLint                                                           |
| `npm run format`        | Format everything with Prettier                                  |
| `npm run format:check`  | Check formatting without writing                                 |
| `npm run typecheck`     | Generate route types and run `tsc --noEmit`                      |
| `npm test`              | Vitest unit tests                                                |
| `npm run test:e2e`      | Playwright smoke test against `out/` (run `npm run build` first) |
| `npm run resume:pdf`    | Print `/resume` to `public/Rob-Resume.pdf` (see below)           |
| `npm run repo-previews` | Snapshot GitHub's preview of each Project's repo (see below)     |

A pre-commit hook (Husky + lint-staged) formats and lints staged files.

## Résumé PDF

`public/Rob-Resume.pdf` is printed from `/resume` and committed. `app/resume/resume-pdf.lock` holds the sha256 of every file the Résumé is built from (found by following the page's imports), of the print settings and of the PDF itself. When one stops matching, `npm run build` fails, locally, in CI and on Vercel, and so does a commit that stages a Résumé input. Then run `npm run resume:pdf` and commit both files. It formats the inputs, builds the site and prints the page with Playwright's Chromium (`npx playwright install chromium` once). When nothing changed it does nothing; `npm run resume:pdf -- --force` re-renders anyway, for example after a Chromium update.

The PDF also shows my full name and phone number, which the page leaves out ([ADR 0001](docs/adr/0001-private-details-only-in-the-resume-pdf.md)). They come from a gitignored `.env.local`: copy `.env.example` and fill it in, or `npm run resume:pdf` refuses to run. The lock doesn't hash them, so re-render with `-- --force` after changing one.

## Repo previews

Each Project page ends with a card for its repo: GitHub's preview image, the repo's name and github.com. The site never asks GitHub for it. `npm run repo-previews` fetches the preview of every Project's `links.repo` and writes `content/repo-previews.json` plus the images in `public/repo-previews/`; commit both. Run it after adding a Project or changing a `links.repo`, and whenever you want GitHub's current image (star counts drift until you do). It fetches everything before writing anything, so if GitHub rate-limits it (HTTP 429) or the network fails, nothing changes and it says when to try again. `npm test` and `npm run build` fail when a Project's exact `links.repo` has no snapshot.

## Deploys

Every pull request runs CI (format, lint, types, unit tests, build, smoke test) on GitHub Actions and gets a Vercel preview deploy. Merging into `main` deploys to production.

## License

The code is MIT-licensed (see [LICENSE](LICENSE)). The content in `content/` and the Résumé PDF are © Rob, all rights reserved. The Satoshi font files in `app/fonts/` belong to Indian Type Foundry and are licensed under the [ITF Free Font License](https://www.fontshare.com/licenses/itf-ffl), not MIT. To use Satoshi yourself, get it from [Fontshare](https://www.fontshare.com/fonts/satoshi).

The brand marks in the Stack and on Project pills come from [Simple Icons](https://simpleicons.org) (CC0), except Playwright's, which is copied from [Devicon](https://devicon.dev) (MIT, © 2015 konpa). Each mark is a trademark of its owner.
