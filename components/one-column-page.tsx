import type { ReactNode } from "react";
import { dictionary } from "@/lib/dictionaries";
import { pathIn, type LanguageCode } from "@/lib/language-versions";
import { NavLink, PageTransition } from "./route-transition";
import styles from "./one-column-page.module.css";

/**
 * The shell for every page that isn't home (Project pages, the Résumé): one centred column with
 * "← Rob" at the top and a link to the Privacy notice at the foot. It owns the chrome that never
 * prints, and the page's route transition.
 */
export function OneColumnPage({
  lang,
  children,
}: {
  lang: LanguageCode;
  children: ReactNode;
}) {
  const t = dictionary(lang);
  return (
    <PageTransition>
      <main className={styles.page}>
        <NavLink
          href={pathIn(lang, "/")}
          direction="back"
          className={`${styles.chrome} ${styles.back}`}
        >
          {t.back}
        </NavLink>
        {children}
        <footer className={styles.footer}>
          <NavLink
            href={pathIn(lang, "/#privacy")}
            direction="back"
            className={styles.chrome}
          >
            {t.privacy}
          </NavLink>
        </footer>
      </main>
    </PageTransition>
  );
}
