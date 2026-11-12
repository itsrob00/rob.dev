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
| `npm run resume:pdf`    | Print each Résumé to its PDF in `public/` (see below)            |
| `npm run repo-previews` | Snapshot GitHub's preview of each Project's repo (see below)     |

A pre-commit hook (Husky + lint-staged) formats and lints staged files.

## Language versions

Every page exists in English and in Italian, at `/en/…` and `/it/…`. The languages come from one list, `lib/language-versions.ts`: the routes, the language menu, the alternate-language links, the sitemap and the Résumé PDFs all follow its published entries. Adding a language means adding an entry, its copy (a dictionary in `lib/dictionaries/`, a file per content module and a folder of Project write-ups, each named by its code) and its Résumé. The type checker fails while any copy is missing, and an entry stays off the site until it's published.

A bare `/` redirects to `/it` when the browser's `Accept-Language` asks for Italian, and to `/en` otherwise. The rule is in `vercel.json`, which `npm run preview` ignores, so check it on a Vercel preview.

## Résumé PDFs

Each published Language version has its own Résumé PDF, printed from its Résumé page and committed: `public/Roberto-Prats-EN.pdf` from `/en/resume` and `public/Roberto-Prats-IT.pdf` from `/it/resume`, with the suffix from `lib/language-versions.ts`. Each Résumé's "Download PDF" ("Scarica PDF") links to its own file, and `/Rob-Resume.pdf` redirects to the English one.

Each PDF has a lock beside the page, `app/[lang]/resume/resume-pdf.<code>.lock`. It holds the sha256 of every file that Language version's Résumé is built from (found by following the page's imports), of the print settings and of the PDF itself. Another Language version's copy (a file named by its code, such as `it.ts`, or a folder named by it) is left out, so editing the Italian copy stales only the Italian PDF, while shared code stales them all. When a line stops matching, `npm run build` fails, locally, in CI and on Vercel, and so does a commit that stages a Résumé input. Then run `npm run resume:pdf` and commit the PDFs and locks it wrote. It formats the inputs, builds the site and prints each stale Résumé with Playwright's Chromium (`npx playwright install chromium` once). When nothing changed it does nothing; `npm run resume:pdf -- --force` re-renders every PDF anyway, for example after a Chromium update. An unpublished Language version gets no PDF.

Every PDF also shows my full name and phone number, which the pages leave out ([ADR 0001](docs/adr/0001-private-details-only-in-the-resume-pdf.md)). They come from a gitignored `.env.local`: copy `.env.example` and fill it in, or `npm run resume:pdf` refuses to run. The locks don't hash them, so re-render with `-- --force` after changing one.

## Repo previews

Each Project page ends with a card for its repo: GitHub's preview image, the repo's name and github.com. The site never asks GitHub for it. `npm run repo-previews` fetches the preview of every Project's `links.repo` and writes `content/repo-previews.json` plus the images in `public/repo-previews/`; commit both. Run it after adding a Project or changing a `links.repo`, and whenever you want GitHub's current image (star counts drift until you do). It fetches everything before writing anything, so if GitHub rate-limits it (HTTP 429) or the network fails, nothing changes and it says when to try again. `npm test` and `npm run build` fail when a Project's exact `links.repo` has no snapshot.

## Deploys

Every pull request runs CI (format, lint, types, unit tests, build, smoke test) on GitHub Actions and gets a Vercel preview deploy. Merging into `main` deploys to production.

## License

The code is MIT-licensed (see [LICENSE](LICENSE)). The content in `content/` and the Résumé PDFs are © Rob, all rights reserved. The Satoshi font files in `app/fonts/` belong to Indian Type Foundry and are licensed under the [ITF Free Font License](https://www.fontshare.com/licenses/itf-ffl), not MIT. To use Satoshi yourself, get it from [Fontshare](https://www.fontshare.com/fonts/satoshi).

The brand marks in the Stack and on Project pills come from [Simple Icons](https://simpleicons.org) (CC0), except Playwright's, which is copied from [Devicon](https://devicon.dev) (MIT, © 2015 konpa). Each mark is a trademark of its owner.
