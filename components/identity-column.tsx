import { profile } from "@/content/profile";
import { Anchor } from "./anchor";
import { GaetaClock } from "./gaeta-clock";
import { FadeUp } from "./motion";
import { NavLink } from "./route-transition";
import { SectionNav, type NavItem } from "./section-nav";
import { ThemeToggle } from "./theme-toggle";
import styles from "./identity-column.module.css";

export function IdentityColumn({ nav }: { nav: readonly NavItem[] }) {
  return (
    <FadeUp as="header" stagger className={styles.column}>
      <h1 className={styles.name}>{profile.name}</h1>
      <p className={styles.role}>{profile.role}</p>
      <p className={styles.location}>{profile.location}</p>
      <p className={styles.blurb}>{profile.blurb}</p>
      <SectionNav items={nav} />

      <div className={styles.foot}>
        <ul className={styles.links}>
          <li>
            <Anchor href={`mailto:${profile.email}`}>Email</Anchor>
          </li>
          <li>
            <Anchor href={profile.linkedin} rel="me">
              LinkedIn
            </Anchor>
          </li>
          <li>
            <Anchor href={profile.github} rel="me">
              GitHub
            </Anchor>
          </li>
          <li>
            <NavLink href="/resume" direction="forward">
              Résumé
            </NavLink>
          </li>
        </ul>
        <div className={styles.meta}>
          <GaetaClock />
          <ThemeToggle />
        </div>
      </div>
    </FadeUp>
  );
}
