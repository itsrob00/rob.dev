import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { NavLink } from "@/components/route-transition";
import { profile } from "@/content/profile";
import { dictionary } from "@/lib/dictionaries";
import {
  DEFAULT_LANGUAGE_VERSION,
  LANGUAGE_VERSIONS,
  pathIn,
} from "@/lib/language-versions";
import { languageSwitchScript } from "@/lib/language-switch";
import { DEFAULT_THEME, themeScript } from "@/lib/theme";
import { jetbrainsMono, satoshi } from "./fonts";
import styles from "./global-not-found.module.css";
import "./globals.css";

// Every unknown URL. Next adds noindex itself; no canonical or description, so the 404 claims no URL
// (e2e/metadata.spec.ts). The title is spelled out: no layout's template reaches this page.
export const metadata: Metadata = {
  title: {
    absolute: `${dictionary[DEFAULT_LANGUAGE_VERSION.code].notFound.title} | ${profile.name}`,
  },
};

export default function GlobalNotFound() {
  return (
    <html
      lang={DEFAULT_LANGUAGE_VERSION.code}
      data-theme={DEFAULT_THEME}
      className={`${satoshi.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script dangerouslySetInnerHTML={{ __html: languageSwitchScript }} />
      </head>
      <body>
        <main className={styles.page}>
          {LANGUAGE_VERSIONS.map(({ code, published }, index) => {
            const { title, text } = dictionary[code].notFound;
            const Heading = index === 0 ? "h1" : "h2";
            const home = published ? code : DEFAULT_LANGUAGE_VERSION.code;
            return (
              <section key={code} lang={code} className={styles.section}>
                <Heading className={styles.title}>{title}</Heading>
                <p className={styles.text}>
                  {text((words) => (
                    <NavLink
                      href={pathIn(home, "/")}
                      direction="back"
                      className={styles.link}
                    >
                      {words}
                    </NavLink>
                  ))}
                </p>
              </section>
            );
          })}
        </main>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
