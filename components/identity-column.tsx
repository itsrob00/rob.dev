import { profile } from "@/content/profile";
import { dictionary } from "@/lib/dictionaries";
import { pathIn, type LanguageCode } from "@/lib/language-versions";
import { Anchor } from "./anchor";
import { GaetaClock } from "./gaeta-clock";
import { LanguageMenu } from "./language-menu";
import { FadeUp } from "./motion";
import { NavLink } from "./route-transition";
import { SectionNav, type NavItem } from "./section-nav";
import { ThemeToggle } from "./theme-toggle";
import styles from "./identity-column.module.css";

export function IdentityColumn({
  lang,
  nav,
}: {
  lang: LanguageCode;
  nav: readonly NavItem[];
}) {
  const t = dictionary(lang);
  return (
    <FadeUp as="header" stagger className={styles.column}>
      <h1 className={styles.name}>{profile.name}</h1>
      <p className={styles.role}>{profile.role}</p>
      <p className={styles.location}>{profile.location}</p>
      <p className={styles.blurb}>{profile.blurb}</p>
      <SectionNav label={t.sectionNav} items={nav} />

      <div className={styles.foot}>
        <ul className={styles.links}>
          <li>
            <Anchor href={`mailto:${profile.email}`}>{t.email}</Anchor>
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
            <NavLink href={pathIn(lang, "/resume")} direction="forward">
              {t.resume}
            </NavLink>
          </li>
        </ul>
        <div className={styles.meta}>
          <GaetaClock place={t.clock} />
          <ThemeToggle labels={t.themeSwitch} />
          <LanguageMenu label={t.language} align="end" />
        </div>
      </div>
    </FadeUp>
  );
}
