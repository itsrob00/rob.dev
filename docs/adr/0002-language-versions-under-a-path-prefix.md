# Language versions live under a path prefix

The site has an English and an Italian Language version. Both are prefixed, `/en/…` and `/it/…`, under one `app/[lang]/` root layout, following the internationalization guide bundled with Next. This reverses the v1 scope rule "English only". The site is a static export, so nothing runs per request. Prefixing both versions is the only shape where every page ships the right `<html lang>`, metadata and share card as plain built files. The site was new when this was decided, so moving the English URLs cost little: `vercel.json` redirects the old ones permanently, and it sends a bare `/` to `/it` or `/en` from the browser's `Accept-Language`.

## Considered Options

- **English unprefixed, Italian under `/it` with a second root layout (route groups).** It keeps the English URLs, but switching language becomes a full page load. The `<head>` (theme script, fonts, analytics) is duplicated, and it is not the documented pattern.
- **One root layout plus an `app/it/` copy of each page.** It needs the fewest moves, but Italian pages would ship `lang="en"`.
- **Switching language in the browser, like the theme.** There would be no Italian URLs, titles or share cards, and the built HTML would stay English.
- **The guide's `proxy.ts` language detection.** It isn't available under `output: "export"`, so detection moved to `vercel.json`. `serve out` ignores that file, so the redirect is checked on a Vercel preview only.

## Consequences

- No `layout.tsx` sits above `app/[lang]/`, so a single `404.html` comes from `app/global-not-found.tsx`. It must bring its own CSS, fonts and theme script, and it carries both languages, because one file serves every unknown URL.
- The Résumé fingerprint follows routes by path, so its route list has to name the `[lang]` folder.
