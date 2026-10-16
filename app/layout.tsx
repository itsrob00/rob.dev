import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { jetbrainsMono, satoshi } from "./fonts";
import { DEFAULT_THEME, themeScript } from "@/lib/theme";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rob | Front-end Engineer & Tech Lead",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // The head script may change data-theme before React hydrates, so the DOM wins here.
    <html
      lang="en"
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
