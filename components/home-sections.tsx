import { experience } from "@/content/experience";
import { profile } from "@/content/profile";
import { stack } from "@/content/stack";
import { formatDateRange } from "@/lib/date-range";
import { getProjects } from "@/lib/projects";
import { FadeUp, LiftItem } from "./motion";
import { NavLink, SharedTitle } from "./route-transition";
import { StackTags } from "./stack-tags";
import { Technology } from "./technology";
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
        <LiftItem key={project.slug} className={styles.card}>
          <p className={styles.kicker}>{project.kicker}</p>
          <h3 className={styles.cardTitle}>
            <SharedTitle slug={project.slug}>
              <NavLink
                href={project.href}
                direction="forward"
                className={styles.cardLink}
              >
                {project.title}
              </NavLink>
            </SharedTitle>
          </h3>
          <p className={styles.summary}>{project.summary}</p>
          <StackTags stack={project.stack} />
        </LiftItem>
      ))}
    </ul>
  );
}

export function ExperienceList() {
  return (
    <ol className={styles.experience}>
      {experience.map((entry) => (
        <li key={entry.employer}>
          <div className={styles.entry}>
            <p className={styles.when}>{formatDateRange(entry, "year")}</p>
            <h3 className={styles.role}>
              {entry.employer}{" "}
              <span className={styles.organization}>· {entry.role}</span>
            </h3>
          </div>
          <ol className={styles.experience}>
            {entry.engagements.map((engagement) => (
              <li key={engagement.name} className={styles.entry}>
                <p className={styles.when}>
                  {formatDateRange(engagement, "year")}
                </p>
                <div>
                  <h4 className={styles.role}>
                    {engagement.name}{" "}
                    <span className={styles.organization}>
                      · {engagement.role}
                    </span>
                  </h4>
                  <p className={styles.client}>{engagement.client}</p>
                  <p className={styles.blurb}>{engagement.description}</p>
                </div>
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
