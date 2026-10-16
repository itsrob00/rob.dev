import { IdentityColumn } from "@/components/identity-column";
import styles from "./page.module.css";

// Section slots for ticket 04 (About, Experience, Stack) and ticket 05 (Selected Work) to fill.
const sections = [
  { id: "about", title: "About" },
  { id: "work", title: "Selected Work" },
  { id: "experience", title: "Experience" },
  { id: "stack", title: "Stack" },
];

export default function Home() {
  return (
    <div className={styles.grid}>
      <IdentityColumn />
      <main className={styles.main}>
        {sections.map((section) => (
          <section
            key={section.id}
            id={section.id}
            aria-labelledby={`${section.id}-title`}
            className={styles.section}
          >
            <h2 id={`${section.id}-title`} className={styles.title}>
              {section.title}
            </h2>
          </section>
        ))}
      </main>
    </div>
  );
}
