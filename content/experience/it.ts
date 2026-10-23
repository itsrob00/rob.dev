import type { Experience } from ".";

export const it = [
  {
    employer: "Exolab S.r.l., Roma",
    role: "Front-end Software Engineer",
    start: "2023-01",
    engagements: [
      {
        name: "PCO",
        role: "Front-end Tech Lead",
        client: "Sogei",
        start: "2026-01",
        tech: [
          "React",
          "Redux Toolkit",
          "TypeScript",
          "Tailwind",
          "Vite",
          "Jest",
          "Vitest",
        ],
        description:
          "Piattaforma per la rendicontazione di tempi e attività delle strutture centrali e territoriali della PA, avviata da IBM, passata a Exolab e tuttora in sviluppo.",
        bullets: [
          "Unico responsabile della QA front-end: ho introdotto gli unit test, assenti quando abbiamo preso in carico il progetto, e portato la suite a oltre 1.000 test con coverage superiore all'85%. Approvo ogni rilascio front-end.",
          "Sono il riferimento tecnico di 3 sviluppatori front-end e definisco architettura e UX. Lavoro con 4 sviluppatori back-end e 2 analisti e presento le proposte direttamente ai clienti.",
          "Sviluppo le feature con devflow, il mio flusso di lavoro per Claude Code basato sulle skill di Matt Pocock e su pstack, ancora in sviluppo e open source su GitHub.",
        ],
      },
      {
        name: "Component library per la Console Admin VLT",
        role: "Front-end Consultant",
        client: "Sisal, tramite Reply",
        start: "2025-10",
        end: "2025-12",
        tech: [
          "React",
          "Redux Toolkit",
          "TypeScript",
          "Tailwind",
          "Headless UI",
          "Vite",
        ],
        description:
          "Component library per la nuova console di amministrazione delle VLT di Sisal, realizzata nei 3 mesi risparmiati grazie alla consegna anticipata di Athena.",
        bullets: [
          "Ho progettato e sviluppato da solo la component library, curando sia la UI/UX sia l'implementazione con Claude Design e Claude Code.",
          "Sisal la sta usando per realizzare la nuova console, che prenderà il posto della vecchia applicazione scritta in Visual Basic.",
        ],
      },
      {
        name: "Athena",
        role: "Front-end Consultant",
        client: "Sisal, tramite Reply",
        start: "2025-01",
        end: "2025-10",
        tech: ["React", "Redux Toolkit", "TypeScript", "Tailwind", "Vite"],
        description:
          "Game shell che ospita i giochi online di Sisal e gestisce ricariche, prelievi e storico del giocatore.",
        bullets: [
          "Ho migrato l'intera interfaccia da React 15 (class component) a React 19 e la build da Webpack a Vite. Abbiamo rilasciato a settembre, 3 mesi prima della scadenza di dicembre, anche grazie all'uso di assistenti AI in chat.",
          "In un team di 2 sviluppatori ho scritto la maggior parte del codice, ho aggiornato le librerie interne a React moderno e ho documentato il lavoro per il passaggio di consegne.",
        ],
      },
      {
        name: "GestCert ed EMCS",
        role: "Front-end Developer",
        client: "Sogei, per ADM",
        start: "2023-04",
        end: "2024-12",
        tech: ["React", "Redux Toolkit", "Bootstrap"],
        description:
          "Sistemi in produzione dell'Agenzia delle Dogane e dei Monopoli: GestCert rilascia i certificati digitali con cui i sistemi degli operatori si autenticano sui server ADM; EMCS traccia in tempo reale i prodotti sottoposti ad accisa in regime sospensivo.",
        bullets: [
          "In un team di 9–12 persone ho sviluppato funzionalità front-end per entrambi i sistemi, rispettando le scadenze di rilascio del cliente, e ho aiutato i colleghi sui task più complessi.",
        ],
      },
    ],
  },
] as const satisfies readonly Experience[];
