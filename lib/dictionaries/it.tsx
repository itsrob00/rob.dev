import type { Dictionary } from ".";

export const it: Dictionary = {
  sections: {
    about: "Chi sono",
    work: "Lavori",
    experience: "Esperienza",
  },
  sectionNav: "Sezioni",
  languageMenu: "Lingua",
  stack: "Stack",
  builtWith: "Realizzato con",
  email: "Email",
  resume: "Curriculum",
  back: "← Rob",
  privacy: "Privacy",
  privacyText: (email) => (
    <>
      Nessun cookie. Il sito è ospitato da Vercel, che conta le visite in forma
      anonima, con un hash che si azzera ogni giorno. La scelta del tema resta
      nel tuo browser. Domande o richieste GDPR: {email}.
    </>
  ),
  inGaeta: "a Gaeta",
  themeSwitch: { light: "Passa al tema chiaro", dark: "Passa al tema scuro" },
  dates: {
    months: [
      "gen",
      "feb",
      "mar",
      "apr",
      "mag",
      "giu",
      "lug",
      "ago",
      "set",
      "ott",
      "nov",
      "dic",
    ],
    ongoing: "oggi",
    inProgress: "In corso",
  },
  project: {
    kinds: { "Open source": "Open source", Concept: "Concept" },
    role: "Ruolo",
    when: "Periodo",
    repository: "Repository ↗",
    live: "Sito online ↗",
    repoPreview: (name) => `${name} su GitHub`,
  },
  resumePage: {
    description: ({ name, role, location }) =>
      `Curriculum di ${name}, ${role} con base a ${location}.`,
    download: "Scarica PDF",
    native: "Madrelingua",
    contact: "Contatti",
    headings: {
      profile: "Profilo",
      experience: "Esperienza",
      projects: "Progetti",
      skills: "Competenze",
      languages: "Lingue",
      education: "Formazione",
    },
  },
  notFound: {
    title: "Pagina non trovata",
    text: (homeLink) => (
      <>
        A questo indirizzo non c&apos;è niente: forse la pagina è stata
        spostata, o il link contiene un refuso. Nella mia{" "}
        {homeLink("home page")} trovi tutto il sito.
      </>
    ),
  },
};
