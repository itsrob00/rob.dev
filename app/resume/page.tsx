import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Anchor } from "@/components/anchor";
import { OneColumnPage } from "@/components/one-column-page";
import { experience } from "@/content/experience";
import { profile } from "@/content/profile";
import { resume } from "@/content/resume";
import { formatDateRange } from "@/lib/date-range";
import { getProjects } from "@/lib/projects";
import {
  contactItems,
  displayUrl,
  formatEducationDates,
  type ContactItem,
} from "@/lib/resume";
import { homeCard, pageMetadata } from "@/lib/site-metadata";
import styles from "./page.module.css";

// The Résumé renders its own markup rather than the home components: their accent pills and
// kickers would break "accent only on links" in print. Every link here is absolute (or mailto),
// because the printed PDF is read away from this site. The PDF adds Rob's full name and phone
// number at render time (scripts/resume-private.mts), so neither is in this page.

// No sharing image of its own: it reuses home's.
export const metadata: Metadata = pageMetadata({
  path: "/resume",
  title: "Résumé",
  description: `Résumé of ${profile.name}, ${profile.role} based in ${profile.location}.`,
  card: homeCard,
});

export default function ResumePage() {
  return (
    <OneColumnPage>
      {/* Outside the article, so it never prints and the article's links stay absolute. Not a NavLink:
          the PDF is a static file in public/, not a route for next/link. */}
      <Anchor
        href="/Rob-Resume.pdf"
        download="Rob-Resume.pdf"
        className={styles.download}
      >
        Download PDF
      </Anchor>
      <article className={styles.resume}>
        <header className={styles.header}>
          <h1 className={styles.name}>{profile.name}</h1>
          <p className={styles.role}>{profile.role}</p>
          <ul className={styles.contact} aria-label="Contact">
            {contactItems(profile, resume.remote).map((item) => (
              <Contact
                key={item.kind === "text" ? item.text : item.href}
                {...item}
              />
            ))}
          </ul>
        </header>

        <Section title="Profile">
          <p className={styles.summary}>{resume.profileParagraph}</p>
        </Section>

        <Section title="Experience">
          <ol className={styles.entries}>
            {experience.map((entry) => (
              <li key={entry.employer}>
                <Entry
                  title={entry.employer}
                  detail={entry.role}
                  when={formatDateRange(entry, "month")}
                />
                <ol className={styles.engagements}>
                  {entry.engagements.map((engagement) => (
                    <li key={engagement.name} className={styles.engagement}>
                      <Entry
                        level={4}
                        title={engagement.name}
                        detail={engagement.role}
                        when={formatDateRange(engagement, "month")}
                      />
                      <p className={styles.meta}>
                        <span className={styles.client}>
                          {engagement.client}
                        </span>
                        {" · "}
                        {engagement.tech.join(", ")}
                      </p>
                      <p className={styles.text}>{engagement.description}</p>
                      <ul className={styles.bullets}>
                        {engagement.bullets.map((bullet) => (
                          <li key={bullet}>{bullet}</li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ol>
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
                />
                <p className={styles.text}>{project.summary}</p>
                <p className={styles.meta}>
                  {project.stack.join(" · ")}
                  {[project.links.repo, project.links.live].map(
                    (href) =>
                      href && (
                        <span key={href}>
                          {" · "}
                          <Anchor href={href}>{displayUrl(href)}</Anchor>
                        </span>
                      ),
                  )}
                </p>
              </li>
            ))}
          </ol>
        </Section>

        <Section title="Skills">
          <ul className={styles.skills}>
            {resume.skills.map((group) => (
              <li key={group.label}>
                <span className={styles.skillLabel}>{group.label}:</span>{" "}
                {group.items.join(", ")}
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Languages">
          <p className={styles.text}>
            {resume.languages
              .map(({ name, proficiency }) => `${name} (${proficiency})`)
              .join(" · ")}
          </p>
        </Section>

        <Section title="Education">
          <ol className={styles.entries}>
            {resume.education.map((entry) => (
              <li key={entry.title}>
                <Entry
                  title={entry.title}
                  detail={entry.institution}
                  when={formatEducationDates(entry.dates)}
                />
                {"detail" in entry && (
                  <p className={styles.text}>{entry.detail}</p>
                )}
              </li>
            ))}
          </ol>
        </Section>

        <p className={styles.gdpr}>{resume.gdprLine}</p>
      </article>
    </OneColumnPage>
  );
}

function Contact(item: ContactItem) {
  switch (item.kind) {
    case "text":
      return <li>{item.text}</li>;
    case "link":
      return (
        <li>
          <Anchor href={item.href} rel={item.rel}>
            <span className={styles.screenOnly}>{item.screen}</span>
            <span className={styles.printOnly}>{item.print}</span>
          </Anchor>
        </li>
      );
    case "print-link":
      return (
        <li className={styles.printOnly}>
          <Anchor href={item.href} rel={item.rel}>
            {item.print}
          </Anchor>
        </li>
      );
  }
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
  level = 3,
  title,
  detail,
  when,
}: {
  level?: 3 | 4;
  title: string;
  detail: string;
  when: string;
}) {
  const Heading = level === 3 ? "h3" : "h4";
  return (
    <div className={styles.entryHead}>
      <Heading className={styles.entryTitle}>
        {title} <span className={styles.detail}>· {detail}</span>
      </Heading>
      <p className={styles.when}>{when}</p>
    </div>
  );
}
