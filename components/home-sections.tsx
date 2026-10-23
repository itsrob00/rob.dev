import { experience } from "@/content/experience";
import { profileCopy } from "@/content/profile";
import { stack } from "@/content/stack";
import { formatDateRange } from "@/lib/date-range";
import { pathIn, type LanguageCode } from "@/lib/language-versions";
import { getProjects, projectKicker } from "@/lib/projects";
import { FadeUp, LiftItem } from "./motion";
import { NavLink, SharedTitle } from "./route-transition";
import { StackTags } from "./stack-tags";
import { Technology } from "./technology";
import styles from "./home-sections.module.css";

// The bodies of the home page's sections. app/page.tsx wraps each in its <section> and <h2>.

export function About({ lang }: { lang: LanguageCode }) {
  return profileCopy[lang].about.map((paragraph) => (
    <p key={paragraph} className={styles.paragraph}>
      {paragraph}
    </p>
  ));
}

// The title's link stretches over the whole card: one tab stop, named by the title.
export function SelectedWork({ lang }: { lang: LanguageCode }) {
  return (
    <ul className={styles.work}>
      {getProjects(lang).map((project) => (
        <LiftItem key={project.slug} className={styles.card}>
          <p className={styles.kicker}>{projectKicker(project, lang)}</p>
          <h3 className={styles.cardTitle}>
            <SharedTitle slug={project.slug}>
              <NavLink
                href={pathIn(lang, project.href)}
                direction="forward"
                className={styles.cardLink}
              >
                {project.title}
              </NavLink>
            </SharedTitle>
          </h3>
          <p className={styles.summary}>{project.summary}</p>
          <StackTags lang={lang} stack={project.stack} />
        </LiftItem>
      ))}
    </ul>
  );
}

export function ExperienceList({ lang }: { lang: LanguageCode }) {
  return (
    <ol className={styles.experience}>
      {experience[lang].map((entry) => (
        <li key={entry.employer}>
          <h3 className={styles.employer}>{entry.employer}</h3>
          <p className={styles.tenure}>
            {entry.role} · {formatDateRange(entry, "year", lang)}
          </p>
          <ol className={styles.engagements}>
            {entry.engagements.map((engagement) => (
              <li
                key={engagement.name}
                className={styles.engagement}
                data-ongoing={"end" in engagement ? undefined : ""}
              >
                <p className={styles.meta}>
                  {formatDateRange(engagement, "year", lang)} ·{" "}
                  {engagement.client}
                </p>
                <h4 className={styles.name}>
                  {engagement.name}{" "}
                  <span className={styles.role}>· {engagement.role}</span>
                </h4>
                <p className={styles.blurb}>{engagement.description}</p>
              </li>
            ))}
          </ol>
        </li>
      ))}
    </ol>
  );
}

export function StackList() {
  return (
    <FadeUp as="ul" inView stagger className={styles.stack}>
      {stack.map((item) => (
        <li key={item} className={styles.tile}>
          <Technology name={item} markSize={28} />
        </li>
      ))}
    </FadeUp>
  );
}
