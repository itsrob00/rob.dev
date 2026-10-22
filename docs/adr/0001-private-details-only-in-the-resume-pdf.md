# Private details only in the Résumé PDF, added at render time

The Résumé PDF shows Rob's full name and phone number, as a recruiter expects, but the site goes by "Rob" and the repo is public. So the two values live only in a gitignored `.env.local` (`RESUME_FULL_NAME`, `RESUME_PHONE`), and `npm run resume:pdf` writes them into the page just before printing. They never reach tracked source, the site's HTML or the `Rob-Resume.pdf` filename. The PDF itself is public, so this keeps them off the website and out of the code, not secret.

## Considered Options

- **Print-only markup** (values in `content/profile.ts`, hidden on screen with CSS). Simpler, and covered by the Résumé fingerprint, but it puts the number and last name in the repo's source and in the page's HTML, where scrapers read them.

## Consequences

- The Résumé fingerprint can't record the values: a phone number's hash can be brute-forced. The lock still holds the PDF's own hash, so a hand-edited PDF is caught, but changing a value in `.env.local` doesn't make the PDF stale. Re-render with `npm run resume:pdf -- --force` after changing one, or after changing how `scripts/resume-private.mts` fills them in: like the rest of the render script, it isn't a fingerprint input.
- `npm run resume:pdf` refuses to run without both values, so a PDF can't ship without them.
- The page carries no placeholder: `scripts/resume-private.mts` finds the page's own h1, "Contact" list and title, and fails loudly when they stop matching. The e2e print test calls the same function with stand-in values, so CI prints the PDF's header, not the page's shorter one.
- After the build, the render checks that neither value turned up in a tracked file or in the built site.
