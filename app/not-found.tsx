import type { Metadata } from "next";
import { OneColumnPage } from "@/components/one-column-page";
import { NavLink } from "@/components/route-transition";
import { profile } from "@/content/profile";
import styles from "./not-found.module.css";

// Every unknown URL. Next adds noindex itself; no canonical or description, so the 404 claims no URL
// (e2e/metadata.spec.ts). The title is spelled out: the layout's template doesn't reach this page.
export const metadata: Metadata = {
  title: { absolute: `Page not found | ${profile.name}` },
};

export default function NotFound() {
  return (
    <OneColumnPage>
      <h1 className={styles.title}>Page not found</h1>
      <p className={styles.text}>
        There&apos;s nothing at this address. It may have moved, or the link has
        a typo. My{" "}
        <NavLink href="/" direction="back" className={styles.link}>
          home page
        </NavLink>{" "}
        has everything on the site.
      </p>
    </OneColumnPage>
  );
}
