import type { Dictionary } from ".";

export const en: Dictionary = {
  sections: {
    about: "About",
    work: "Work",
    experience: "Experience",
  },
  sectionNav: "Sections",
  languageMenu: "Language",
  stack: "Stack",
  builtWith: "Built with",
  email: "Email",
  resume: "Résumé",
  back: "← Rob",
  privacy: "Privacy",
  privacyText: (email) => (
    <>
      No cookies. Vercel hosts this site and counts visits anonymously, with a
      hash that resets daily. Your theme choice stays in your browser. Questions
      or GDPR requests: {email}.
    </>
  ),
  inGaeta: "in Gaeta",
  themeSwitch: { light: "Switch to light theme", dark: "Switch to dark theme" },
  dates: {
    months: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ],
    ongoing: "now",
    inProgress: "In progress",
  },
  project: {
    kinds: { "Open source": "Open source", Concept: "Concept" },
    role: "Role",
    when: "When",
    repository: "Repository ↗",
    live: "Live site ↗",
    repoPreview: (name) => `${name} on GitHub`,
  },
  resumePage: {
    description: ({ name, role, location }) =>
      `Résumé of ${name}, ${role} based in ${location}.`,
    download: "Download PDF",
    native: "Native",
    contact: "Contact",
    headings: {
      profile: "Profile",
      experience: "Experience",
      projects: "Projects",
      skills: "Skills",
      languages: "Languages",
      education: "Education",
    },
  },
  notFound: {
    title: "Page not found",
    text: (homeLink) => (
      <>
        There&apos;s nothing at this address. It may have moved, or the link has
        a typo. My {homeLink("home page")} has everything on the site.
      </>
    ),
  },
};
