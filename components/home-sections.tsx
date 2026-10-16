import Link from "next/link";
import { experience } from "@/content/experience";
import { profile } from "@/content/profile";
import { stack } from "@/content/stack";
import { formatDateRange } from "@/lib/date-range";
import { getProjects } from "@/lib/projects";
import { StackTags } from "./stack-tags";
import styles from "./home-sections.module.css";

// The bodies of the home page's sections. app/page.tsx wraps each in its <section> and <h2>.

export function About() {
  return profile.about.map((paragraph) => (
    <p key={paragraph} className={styles.paragraph}>
      {paragraph}
    </p>
  ));
}

// The title's link stretches over the whole card: one tab stop, named by the title.
export function SelectedWork() {
  return (
    <ul className={styles.work}>
      {getProjects().map((project) => (
        <li key={project.slug} className={styles.card}>
          <p className={styles.kicker}>{project.kicker}</p>
          <h3 className={styles.cardTitle}>
            <Link href={project.href} className={styles.cardLink}>
              {project.title}
            </Link>
          </h3>
          <p className={styles.summary}>{project.summary}</p>
          <StackTags stack={project.stack} />
        </li>
      ))}
    </ul>
  );
}

export function ExperienceList() {
  return (
    <ol className={styles.experience}>
      {experience.map((entry) => (
        <li key={`${entry.start} ${entry.title}`} className={styles.entry}>
          <p className={styles.when}>{formatDateRange(entry, "year")}</p>
          <div>
            <h3 className={styles.role}>
              {entry.title}{" "}
              <span className={styles.organization}>
                · {entry.organization}
              </span>
            </h3>
            <p className={styles.blurb}>{entry.blurb}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function StackList() {
  return (
    <ul className={styles.stack}>
      {stack.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
