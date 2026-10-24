import { experience } from "@/content/experience";
import { profileCopy } from "@/content/profile";
import { stack } from "@/content/stack";
import { formatDateRange } from "@/lib/date-range";
import { dictionary } from "@/lib/dictionaries";
import { pathIn, type LanguageCode } from "@/lib/language-versions";
import { getProjects, projectKicker } from "@/lib/projects";
import { NavLink, SharedTitle } from "./route-transition";
import { StackTags } from "./stack-tags";
import { Technology } from "./technology";
import { StackChip, WorkCard, WorkHighlight } from "./work-highlight";
import styles from "./home-sections.module.css";

// The bodies of the home page's sections. app/[lang]/page.tsx wraps each in its <section> and <h2>.

export function About({ lang }: { lang: LanguageCode }) {
  return profileCopy[lang].about.map((paragraph) => (
    <p key={paragraph} className={styles.paragraph}>
      {paragraph}
    </p>
  ));
}

// The Stack as chips above every Project's card, lighting each other (components/work-highlight.tsx).
// A card's title link stretches over the whole card: one tab stop, named by the title.
export function Work({ lang }: { lang: LanguageCode }) {
  return (
    <WorkHighlight>
      <ul className={styles.strip} aria-label={dictionary[lang].stack}>
        {stack.map((name) => (
          <li key={name}>
            <StackChip name={name} className={styles.chip}>
              <Technology name={name} markSize={18} />
            </StackChip>
          </li>
        ))}
      </ul>
      <ul className={styles.work}>
        {getProjects(lang).map((project) => (
          <WorkCard
            key={project.slug}
            slug={project.slug}
            stack={project.stack}
            className={styles.card}
          >
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
          </WorkCard>
        ))}
      </ul>
    </WorkHighlight>
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
