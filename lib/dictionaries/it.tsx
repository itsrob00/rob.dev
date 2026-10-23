import type { Dictionary } from ".";

export const it: Dictionary = {
  sections: {
    about: "Chi sono",
    stack: "Stack",
    work: "Lavori selezionati",
    experience: "Esperienza",
  },
  sectionNav: "Sezioni",
  language: "Lingua",
  stack: "Stack",
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
  clock: "a Gaeta",
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
    kicker: (year) => `Open source · ${year}`,
    role: "Ruolo",
    when: "Periodo",
    repository: "Codice sorgente ↗",
    live: "Sito online ↗",
    repoPreview: (name) => `${name} su GitHub`,
  },
  resumePage: {
    description: ({ name, role, location }) =>
      `Curriculum di ${name}, ${role} di base a ${location}.`,
    download: "Scarica PDF",
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
