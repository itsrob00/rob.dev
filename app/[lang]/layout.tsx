import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { jetbrainsMono, satoshi } from "../fonts";
import { languageParams, languageVersion } from "@/lib/language-versions";
import { rootMetadata } from "@/lib/site-metadata";
import { DEFAULT_THEME, themeScript } from "@/lib/theme";
import "../globals.css";

export async function generateMetadata({
  params,
}: LayoutProps<"/[lang]">): Promise<Metadata> {
  return rootMetadata(languageVersion((await params).lang).code);
}

export const dynamicParams = false;

export function generateStaticParams() {
  return languageParams();
}

export default async function RootLayout({
  children,
  params,
}: LayoutProps<"/[lang]">) {
  const { code } = languageVersion((await params).lang);
  return (
    // The head script may change data-theme before React hydrates, so the DOM wins here.
    <html
      lang={code}
      data-theme={DEFAULT_THEME}
      className={`${satoshi.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
