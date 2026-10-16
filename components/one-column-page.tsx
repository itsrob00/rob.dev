import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./one-column-page.module.css";

/**
 * The shell for every page that isn't home (Project pages, the Résumé): one centred column with
 * "← Rob" at the top. It owns the chrome that never prints.
 */
export function OneColumnPage({ children }: { children: ReactNode }) {
  return (
    <main className={styles.page}>
      <Link href="/" className={styles.back}>
        ← Rob
      </Link>
      {children}
    </main>
  );
}
