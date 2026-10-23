import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { NavLink } from "@/components/route-transition";
import { profile } from "@/content/profile";
import {
  DEFAULT_LANGUAGE_VERSION,
  LANGUAGE_VERSIONS,
  pathIn,
  type LanguageCode,
} from "@/lib/language-versions";
import { DEFAULT_THEME, themeScript } from "@/lib/theme";
import { jetbrainsMono, satoshi } from "./fonts";
import styles from "./global-not-found.module.css";
import "./globals.css";

// Every unknown URL. Next adds noindex itself; no canonical or description, so the 404 claims no URL
// (e2e/metadata.spec.ts). The title is spelled out: no layout's template reaches this page.
export const metadata: Metadata = {
  title: { absolute: `Page not found | ${profile.name}` },
};

const COPY = {
  en: {
    title: "Page not found",
    Text: ({ home }) => (
      <>
        There&apos;s nothing at this address. It may have moved, or the link has
        a typo. My{" "}
        <NavLink href={home} direction="back" className={styles.link}>
          home page
        </NavLink>{" "}
        has everything on the site.
      </>
    ),
  },
  it: {
    title: "Pagina non trovata",
    Text: ({ home }) => (
      <>
        A questo indirizzo non c&apos;è niente: forse la pagina è stata
        spostata, o il link contiene un refuso. Nella mia{" "}
        <NavLink href={home} direction="back" className={styles.link}>
          home page
        </NavLink>{" "}
        trovi tutto il sito.
      </>
    ),
  },
} satisfies Record<
  LanguageCode,
  { title: string; Text: (props: { home: string }) => ReactNode }
>;

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
      </head>
      <body>
        <main className={styles.page}>
          {LANGUAGE_VERSIONS.map(({ code, published }, index) => {
            const { title, Text } = COPY[code];
            const Heading = index === 0 ? "h1" : "h2";
            const home = published ? code : DEFAULT_LANGUAGE_VERSION.code;
            return (
              <section key={code} lang={code} className={styles.section}>
                <Heading className={styles.title}>{title}</Heading>
                <p className={styles.text}>
                  <Text home={pathIn(home, "/")} />
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
