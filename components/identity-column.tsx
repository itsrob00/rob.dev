import { profile, profileCopy } from "@/content/profile";
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
  const t = dictionary[lang];
  const { role, location, blurb } = profileCopy[lang];
  return (
    <FadeUp as="header" stagger className={styles.column}>
      <h1 className={styles.name}>{profile.name}</h1>
      <p className={styles.role}>{role}</p>
      <p className={styles.location}>{location}</p>
      <p className={styles.blurb}>{blurb}</p>
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
          <GaetaClock place={t.inGaeta} />
          <div className={styles.controls}>
            <ThemeToggle labels={t.themeSwitch} />
            <LanguageMenu label={t.languageMenu} sections={nav} align="end" />
          </div>
        </div>
      </div>
    </FadeUp>
  );
}
