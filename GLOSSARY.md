# Personal Portfolio

Rob's personal site: who Rob is, what Rob has built and, later, what Rob writes.

## Language

**Experience**:
Rob's time at one employer: title, employer and dates, made up of one or more Engagements. Lives in the Experience section and the Résumé.
_Avoid_: Job, position, work history

**Engagement**:
One piece of client work inside an Experience, with its own name, Rob's role on it, the client and dates.
_Avoid_: Project, assignment, gig

**Project**:
A piece of public work, something a visitor can open (a repo or a live site), that gets its own page on the site. Client work that can't be opened is not a Project: it appears as an Engagement and, later, in Posts.
_Avoid_: Work item, portfolio piece, case study

**Post**:
A dated piece of writing on the blog. Not part of v1; it will sit alongside Projects as the second kind of long-form entry.
_Avoid_: Article, blog entry

**Selected Work**:
The home-page section that lists every Project, newest first, one card each.
_Avoid_: Portfolio, showcase

**Identity column**:
The column that holds who Rob is: name, role, a one-line blurb, section nav, contact links, the Résumé link and the local clock.
_Avoid_: Hero, left column, sidebar

**Stack**:
The short, curated list of technologies Rob works with, each shown with its brand mark in the Stack section on the home page. Narrower than Skills: only technologies, never practices.
_Avoid_: Tech stack, toolbox

**Skills**:
The Résumé's list of what Rob can do, grouped by area: technologies and practices alike (code review, test strategy, release sign-off). Broader than the Stack, and never shown on the home page.
_Avoid_: Stack, competencies

**Résumé**:
The printable summary of Experience, Projects, Skills, languages and education, built from the same content as the site and offered as a web page and a PDF. The PDF adds Rob's full name and phone number, which the page leaves out. There is one Résumé, in English.
_Avoid_: CV

**Résumé fingerprint**:
The sha256 of every file the Résumé is built from and of its print settings. `app/resume/resume-pdf.lock` records it with the committed PDF's own hash, and the build fails when either stops matching, so the PDF can't go stale silently.
_Avoid_: Checksum, hash file

**Privacy notice**:
The short note at the foot of the home page that tells visitors what the site and its host collect about them and where to send GDPR requests.
_Avoid_: Privacy policy, cookie policy, cookie banner

**Repo preview**:
The card at the end of a Project page that shows the Project's repository the way GitHub presents it when the link is shared: GitHub's preview image, the repo's name and github.com. It's a snapshot Rob refreshes by hand, so it doesn't change on its own.
_Avoid_: Link preview, unfurl, embed
