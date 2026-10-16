import type { ReactNode } from "react";
import { About, ExperienceList, StackList } from "@/components/home-sections";
import { IdentityColumn } from "@/components/identity-column";
import type { NavItem } from "@/components/section-nav";
import styles from "./page.module.css";

// id: the element id, URL hash and nav link target. title: the <h2> and the nav label.
type HomeSection = NavItem & {
  /** Listed in the section nav. Required, so each new section decides (the Privacy notice won't be). */
  inNav: boolean;
  Body: () => ReactNode;
};

// The one list of home sections: <main> renders it in order and the nav takes the inNav ones.
const sections = [
  { id: "about", title: "About", inNav: true, Body: About },
  // Ticket 05 fills this with Selected Work.
  { id: "work", title: "Selected Work", inNav: true, Body: () => null },
  { id: "experience", title: "Experience", inNav: true, Body: ExperienceList },
  { id: "stack", title: "Stack", inNav: true, Body: StackList },
] satisfies readonly HomeSection[];

// Only plain data crosses to the client nav: Body is a function and can't.
const nav = sections
  .filter((section) => section.inNav)
  .map(({ id, title }) => ({ id, title }));

export default function Home() {
  return (
    <div className={styles.grid}>
      <IdentityColumn nav={nav} />
      <main className={styles.main}>
        {sections.map(({ id, title, Body }) => (
          <section
            key={id}
            id={id}
            aria-labelledby={`${id}-title`}
            className={styles.section}
          >
            <h2 id={`${id}-title`} className={styles.title}>
              {title}
            </h2>
            <Body />
          </section>
        ))}
      </main>
    </div>
  );
}
