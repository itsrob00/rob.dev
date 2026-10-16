import { profile } from "@/content/profile";
import { GaetaClock } from "./gaeta-clock";
import { SectionNav, type NavItem } from "./section-nav";
import { ThemeToggle } from "./theme-toggle";
import styles from "./identity-column.module.css";

export function IdentityColumn({ nav }: { nav: readonly NavItem[] }) {
  return (
    <header className={styles.column}>
      <h1 className={styles.name}>{profile.name}</h1>
      <p className={styles.role}>{profile.role}</p>
      <p className={styles.location}>{profile.location}</p>
      <p className={styles.blurb}>{profile.blurb}</p>
      <SectionNav items={nav} />

      <div className={styles.foot}>
        <ul className={styles.links}>
          <li>
            <a href={`mailto:${profile.email}`}>Email</a>
          </li>
          <li>
            <a href={profile.linkedin} rel="me">
              LinkedIn
            </a>
          </li>
          <li>
            <a href={profile.github} rel="me">
              GitHub
            </a>
          </li>
        </ul>
        <div className={styles.meta}>
          <GaetaClock />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
