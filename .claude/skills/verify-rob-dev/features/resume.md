# Résumé

The Résumé is a one-column page built from the same records as the site (Profile, Experience with each Engagement's tech and bullets, Projects, Skills and more), with a `Download PDF` link. Printing it gives one black-on-white A4 page; the downloaded PDF is a committed file rendered from that page on Rob's machine.

## Sub-features

- `resume-page` `/resume` renders every section from the records.
- `resume-print` printing gives one A4 page, black on white, links the only colour.
- `resume-pdf` `Download PDF` downloads `Rob-Resume.pdf`.

## How to get to it (user POV)

- Choose `Résumé` in the Identity column on `/`.
- Open `/resume` directly.

## Driving it with verify.mjs

Preconditions:

- `doctor` prints `OK`.

- **Page.** Run `verify.mjs shot resume --name resume --full --run resume`. The ARIA snapshot has h2 `Experience` with the employer as h3 and each Engagement as h4.
- **Light.** Run `verify.mjs shot resume --name resume-light --full --theme light --run resume`.
- **Print and PDF.** Not in the helper: run `npx playwright test -g "Résumé prints|Résumé PDF downloads"` against a fresh build.

## Gotchas

- The PDF is committed and fingerprinted. Any edit to what the Résumé is built from fails `launch`'s build until Rob runs `npm run resume:pdf`; that's a precondition to report, not to bypass.
- Private details live only in the PDF (see `docs/adr/0001-private-details-only-in-the-resume-pdf.md`); never paste PDF contents into public evidence.
