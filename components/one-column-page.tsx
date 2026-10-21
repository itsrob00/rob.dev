import type { ReactNode } from "react";
import { NavLink, PageTransition } from "./route-transition";
import styles from "./one-column-page.module.css";

/**
 * The shell for every page that isn't home (Project pages, the Résumé): one centred column with
 * "← Rob" at the top and a link to the Privacy notice at the foot. It owns the chrome that never
 * prints, and the page's route transition.
 */
export function OneColumnPage({ children }: { children: ReactNode }) {
  return (
    <PageTransition>
      <main className={styles.page}>
        <NavLink href="/" direction="back" className={styles.back}>
          ← Rob
        </NavLink>
        {children}
        <footer className={styles.footer}>
          <NavLink href="/#privacy" direction="back" className={styles.chrome}>
            Privacy
          </NavLink>
        </footer>
      </main>
    </PageTransition>
  );
}
