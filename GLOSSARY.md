# Personal Portfolio

Rob's personal site: who Rob is, what Rob has built and, later, what Rob writes.

## Language

**Experience**:
Rob's time at one employer: title, employer and dates, made up of one or more Engagements. Lives in the Experience section and the Résumé.
_Avoid_: Job, position, work history
_Italian_: Esperienza

**Engagement**:
One piece of client work inside an Experience, with its own name, Rob's role on it, the client and dates.
_Avoid_: Project, assignment, gig

**Project**:
A piece of Rob's own work that gets its own page on the site, usually something a visitor can open (a repo or a live site). One that isn't public yet has a page but nothing to open until it is. Client work is not a Project: it appears as an Engagement and, later, in Posts.
_Avoid_: Work item, portfolio piece, case study
_Italian_: Progetto

**Post**:
A dated piece of writing on the blog. Not part of v1; it will sit alongside Projects as the second kind of long-form entry.
_Avoid_: Article, blog entry

**Work**:
The home-page section that shows the Stack and lists every Project, one card each: the ones a visitor can open first, newest first within each group. Pointing at a technology lights the Projects that use it, and pointing at a Project lights its technologies.
_Avoid_: Selected Work, portfolio, showcase
_Italian_: Lavori (not Portfolio)

**Identity column**:
The column that holds who Rob is: name, role, a one-line blurb, section nav, contact links, the Résumé link and the local clock.
_Avoid_: Hero, left column, sidebar

**Stack**:
The short, curated list of technologies Rob works with, each shown with its brand mark at the top of the Work section. A Project may use technologies outside it. Narrower than Skills: only technologies, never practices.
_Avoid_: Tech stack, toolbox
_Italian_: Stack

**Skills**:
The Résumé's list of what Rob can do, grouped by area: technologies and practices alike (code review, test strategy, release sign-off). Broader than the Stack, and never shown on the home page.
_Avoid_: Stack, competencies
_Italian_: Competenze (not Abilità)

**Résumé**:
The printable summary of Experience, the Projects a reader can open, Skills, languages and education, built from the same content as the site and offered as a web page and a PDF. The PDF adds Rob's full name and phone number, which the page leaves out. There is one Résumé per Language version, each with its own PDF.
_Avoid_: CV
_Italian_: Curriculum (not CV, not Résumé)

**Résumé fingerprint**:
The sha256 of every file the Résumé is built from and of its print settings. A lock per Language version records it with that PDF's own hash, and the build fails when either stops matching, so the PDF can't go stale silently.
_Avoid_: Checksum, hash file

**Privacy notice**:
The short note at the foot of the home page that tells visitors what the site and its host collect about them and where to send GDPR requests.
_Avoid_: Privacy policy, cookie policy, cookie banner
_Italian_: Informativa privacy (label "Privacy")

**Repo preview**:
The card at the end of a Project page that shows the Project's repository the way GitHub presents it when the link is shared: GitHub's preview image, the repo's name and github.com. It's a snapshot Rob refreshes by hand, so it doesn't change on its own.
_Avoid_: Link preview, unfurl, embed

**Language version**:
One language's copy of the site: English and Italian today, more later. Every page exists in each, at its own path (`/en/…`, `/it/…`), and each has its own Résumé. One list names them all; a Language version goes live only once it's published there. Not the same as the languages Rob speaks, which the Résumé lists.
_Avoid_: Locale, translation, edition

**Language switch**:
Picking another Language version from the language menu, which opens the same page, at the same place, in that Language version. The page crossfades into the new one and nothing on it rises.
_Avoid_: Translate, locale change
