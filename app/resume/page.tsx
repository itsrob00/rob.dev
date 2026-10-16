import type { Metadata } from "next";
import type { ReactNode } from "react";
import { OneColumnPage } from "@/components/one-column-page";
import { education } from "@/content/education";
import { experience } from "@/content/experience";
import { languages } from "@/content/languages";
import { profile } from "@/content/profile";
import { stack } from "@/content/stack";
import { formatDateRange, formatYearSpan } from "@/lib/date-range";
import { getProjects } from "@/lib/projects";
import styles from "./page.module.css";

// The Résumé renders its own markup rather than the home components: their accent pills and
// kickers would break "accent only on links" in print. Every link here is absolute (or mailto),
// because the printed PDF is read away from this site.

export const metadata: Metadata = {
  title: "Résumé",
  description: `Résumé of ${profile.name}, ${profile.role} based in ${profile.location}.`,
};

export default function ResumePage() {
  return (
    <OneColumnPage>
      <article className={styles.resume}>
        <header className={styles.header}>
          <h1 className={styles.name}>{profile.name}</h1>
          <p className={styles.role}>{profile.role}</p>
          <ul className={styles.contact} aria-label="Contact">
            <li>{profile.location}</li>
            <li>
              <a href={`mailto:${profile.email}`}>{profile.email}</a>
            </li>
            <li>
              <a href={profile.site}>{displayUrl(profile.site)}</a>
            </li>
            <li>
              <a href={profile.linkedin} rel="me">
                {displayUrl(profile.linkedin)}
              </a>
            </li>
            <li>
              <a href={profile.github} rel="me">
                {displayUrl(profile.github)}
              </a>
            </li>
          </ul>
        </header>

        <Section title="Summary">
          <p className={styles.summary}>{profile.blurb}</p>
        </Section>

        <Section title="Experience">
          <ol className={styles.entries}>
            {experience.map((entry) => (
              <li key={`${entry.start} ${entry.title}`}>
                <Entry
                  title={entry.title}
                  detail={entry.organization}
                  when={formatDateRange(entry, "month")}
                >
                  <p className={styles.text}>{entry.blurb}</p>
                </Entry>
              </li>
            ))}
          </ol>
        </Section>

        <Section title="Projects">
          <ol className={styles.entries}>
            {getProjects().map((project) => (
              <li key={project.slug}>
                <Entry
                  title={project.title}
                  detail={project.role}
                  when={formatDateRange(project, "month")}
                >
                  <p className={styles.text}>{project.summary}</p>
                  <p className={styles.meta}>
                    {project.stack.join(" · ")}
                    {[project.links.repo, project.links.live].map(
                      (href) =>
                        href && (
                          <span key={href}>
                            {" · "}
                            <a href={href}>{displayUrl(href)}</a>
                          </span>
                        ),
                    )}
                  </p>
                </Entry>
              </li>
            ))}
          </ol>
        </Section>

        <Section title="Stack">
          <p className={styles.text}>{stack.join(" · ")}</p>
        </Section>

        <Section title="Languages">
          <p className={styles.text}>
            {languages
              .map(({ name, proficiency }) => `${name} (${proficiency})`)
              .join(" · ")}
          </p>
        </Section>

        <Section title="Education">
          <ol className={styles.entries}>
            {education.map((entry) => (
              <li key={entry.institution}>
                <Entry
                  title={`${entry.qualification}, ${entry.field}`}
                  detail={`${entry.institution}, ${entry.place}`}
                  when={formatYearSpan(entry.years)}
                />
              </li>
            ))}
          </ol>
        </Section>
      </article>
    </OneColumnPage>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  const id = title.toLowerCase();
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={styles.section}>
      <h2 id={`${id}-title`} className={styles.heading}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Entry({
  title,
  detail,
  when,
  children,
}: {
  title: string;
  detail: string;
  when: string;
  children?: ReactNode;
}) {
  return (
    <>
      <div className={styles.entryHead}>
        <h3 className={styles.entryTitle}>
          {title} <span className={styles.detail}>· {detail}</span>
        </h3>
        <p className={styles.when}>{when}</p>
      </div>
      {children}
    </>
  );
}

/** "https://www.linkedin.com/in/robertoprats" → "linkedin.com/in/robertoprats". The href keeps the full URL. */
function displayUrl(href: string): string {
  return href.replace(/^https:\/\/(www\.)?/, "").replace(/\/$/, "");
}
