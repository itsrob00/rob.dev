import fs from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { profile } from "../content/profile";
import { SHARE_IMAGE, type ShareCard } from "./site-metadata";
import { parseThemeTokens, type ThemeTokens } from "./theme-tokens";

// The one place the generated images are drawn: the 1200x630 sharing card (home and each Project;
// the Résumé reuses home's) and the "R" monogram (favicon and Apple touch icon). Both are dark, like
// the site's default theme. Build-time only: it reads the Satoshi OTFs and app/globals.css from disk,
// since next/og takes TTF/OTF/WOFF only, lays out with flexbox only and can't read CSS variables.
// The Résumé never imports this file, so it's no fingerprint input.

/** A page's sharing card as a 1200x630 PNG. */
export async function renderShareCard(card: ShareCard): Promise<ImageResponse> {
  const { fonts, colours } = await assets();
  return new ImageResponse(<Card card={card} colours={colours} />, {
    width: SHARE_IMAGE.width,
    height: SHARE_IMAGE.height,
    fonts,
  });
}

/**
 * The "R" monogram, `size` px square: an accent letter on the dark background, full bleed (iOS
 * rounds the touch icon itself).
 */
export async function renderMonogram(size: number): Promise<ImageResponse> {
  const { fonts, colours } = await assets();
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: colours.bg,
        color: colours.accent,
        fontFamily: "Satoshi",
        fontWeight: 700,
        fontSize: size * 0.72,
        lineHeight: 1,
      }}
    >
      {profile.name[0]}
    </div>,
    { width: size, height: size, fonts },
  );
}

type Font = {
  name: "Satoshi";
  data: Buffer;
  weight: 400 | 500 | 700;
  style: "normal";
};

let loaded: Promise<{ fonts: Font[]; colours: ThemeTokens }> | undefined;

/**
 * Fonts and colours, read once per build worker. The OTFs are the ones app/fonts/index.ts gives
 * next/font; that module can't be imported here, since localFont only runs under Next's compiler.
 */
function assets() {
  loaded ??= (async () => {
    const root = process.cwd();
    const font = async (
      file: string,
      weight: Font["weight"],
    ): Promise<Font> => ({
      name: "Satoshi",
      style: "normal",
      weight,
      data: await fs.readFile(path.join(root, "app", "fonts", file)),
    });
    const [regular, medium, bold, css] = await Promise.all([
      font("Satoshi-Regular.otf", 400),
      font("Satoshi-Medium.otf", 500),
      font("Satoshi-Bold.otf", 700),
      fs.readFile(path.join(root, "app", "globals.css"), "utf8"),
    ]);
    return {
      fonts: [regular, medium, bold],
      colours: parseThemeTokens(css),
    };
  })();
  return loaded;
}

/** Kicker at the top, title and text in the middle, then an accent bar and the site's host. */
function Card({ card, colours }: { card: ShareCard; colours: ThemeTokens }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 80,
        background: colours.bg,
        color: colours.fg,
        fontFamily: "Satoshi",
      }}
    >
      <div
        style={{
          display: "flex",
          fontSize: 28,
          fontWeight: 500,
          color: colours.muted,
        }}
      >
        {card.kicker ?? ""}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div
          style={{
            fontSize: card.title.length > 16 ? 72 : 96,
            fontWeight: 700,
            letterSpacing: -2,
            lineHeight: 1.05,
          }}
        >
          {card.title}
        </div>
        <div
          style={{
            fontSize: 36,
            fontWeight: 400,
            lineHeight: 1.35,
            color: colours.muted,
            maxWidth: 960,
            display: "block",
            lineClamp: 3,
          }}
        >
          {card.text}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ width: 64, height: 6, background: colours.accent }} />
        <div style={{ fontSize: 28, fontWeight: 500, color: colours.accent }}>
          {new URL(profile.site).host}
        </div>
      </div>
    </div>
  );
}
