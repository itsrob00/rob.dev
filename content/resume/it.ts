import type { ResumeRecord } from ".";

export const it = {
  profileParagraph:
    "Front-end developer con esperienza in React e TypeScript dal 2023 su sistemi enterprise per la Pubblica Amministrazione e per Sisal. Oggi guido il front-end di PCO come Tech Lead: indirizzo le scelte tecniche di un team di 3 sviluppatori, lavoro a stretto contatto con back-end, analisti e cliente, e sono l'unico responsabile della qualità, con una suite di oltre 1.000 test e una coverage superiore all'85%. Unendo esperienza e disciplina a un flusso di lavoro con agenti AI costruito su misura (open source su GitHub), riesco a consegnare velocemente senza abbassare gli standard di qualità.",
  remote: "Remoto (CET)",
  skills: [
    {
      label: "Front-end",
      items: [
        "React",
        "TypeScript",
        "JavaScript",
        "Redux Toolkit",
        "Tailwind CSS",
        "Vite",
        "Headless UI",
        "Bootstrap",
      ],
    },
    {
      label: "Leadership tecnica",
      items: [
        "Architettura front-end",
        "Guida del team",
        "Code review",
        "Approvazione dei rilasci",
        "Proposte al cliente",
      ],
    },
    {
      label: "Test e qualità",
      items: [
        "Unit test",
        "Strategia di test",
        "Jest",
        "Vitest",
        "React Testing Library",
        "QA front-end",
      ],
    },
    {
      label: "Sviluppo con agenti AI",
      items: ["Claude Code con un flusso multi-agente personalizzato"],
    },
    {
      label: "Altre tecnologie",
      items: [
        "Node.js (Express)",
        "Java (Spring)",
        "API REST",
        "MySQL",
        "MongoDB",
        "Git",
        "Figma",
        "Linux",
      ],
    },
  ],
  languages: [
    { name: "Italiano", proficiency: "native" },
    { name: "Inglese", proficiency: "native" },
  ],
  education: [
    {
      title: "CS50x: Introduction to Computer Science",
      institution: "Harvard University (edX)",
      dates: { kind: "in-progress" },
    },
    {
      title: "Percorso di formazione full-stack",
      institution: "Exolab",
      dates: { kind: "months", start: "2022-09", end: "2023-04" },
      detail:
        "Java, Spring, MySQL e React, poi affiancamento a un senior front-end engineer",
    },
    {
      title: "Diploma tecnico, indirizzo Trasporti e Logistica",
      institution: "Istituto Tecnico Nautico “G. Caboto”, Gaeta",
      dates: { kind: "completed", year: 2019 },
    },
  ],
  gdprLine:
    "Autorizzo il trattamento dei dati personali ai sensi del Reg. UE 2016/679 (GDPR) e del D.Lgs. 196/2003.",
} satisfies ResumeRecord;
