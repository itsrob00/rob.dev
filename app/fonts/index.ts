import { JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";

// Static OTF weights rather than WOFF2 or the variable font: the OG images (next/og) can only read TTF/OTF.
export const satoshi = localFont({
  src: [
    { path: "./Satoshi-Regular.otf", weight: "400", style: "normal" },
    { path: "./Satoshi-Medium.otf", weight: "500", style: "normal" },
    { path: "./Satoshi-Bold.otf", weight: "700", style: "normal" },
  ],
  variable: "--font-satoshi",
  display: "swap",
});

// Downloaded at build time and served from this site, so visitors never hit Google.
export const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});
