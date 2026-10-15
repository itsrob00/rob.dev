# itsrob.dev

My personal site: who I am, what I've built and how I work. It lives at [itsrob.dev](https://itsrob.dev).

## Stack

- Next.js 16 (App Router, Turbopack) with React 19, exported as a fully static site (`output: 'export'`)
- TypeScript in strict mode
- ESLint and Prettier, Vitest for unit tests, Playwright for the smoke test
- Hosted on Vercel

Node 22 (see `.nvmrc`) and npm.

## Scripts

| Script                 | What it does                                                     |
| ---------------------- | ---------------------------------------------------------------- |
| `npm run dev`          | Start the dev server                                             |
| `npm run build`        | Build the static site into `out/`                                |
| `npm run preview`      | Serve `out/` locally                                             |
| `npm run lint`         | ESLint                                                           |
| `npm run format`       | Format everything with Prettier                                  |
| `npm run format:check` | Check formatting without writing                                 |
| `npm run typecheck`    | Generate route types and run `tsc --noEmit`                      |
| `npm test`             | Vitest unit tests                                                |
| `npm run test:e2e`     | Playwright smoke test against `out/` (run `npm run build` first) |

A pre-commit hook (Husky + lint-staged) formats and lints staged files.

## Deploys

Every pull request runs CI (format, lint, types, unit tests, build, smoke test) on GitHub Actions and gets a Vercel preview deploy. Merging into `main` deploys to production.

## License

The code is MIT-licensed (see [LICENSE](LICENSE)). The content in `content/` and my personal assets (photo, Résumé PDF) are © Rob, all rights reserved.
