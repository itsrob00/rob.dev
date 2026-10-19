// The site's palette, read from app/globals.css for code that can't use CSS variables: the generated
// sharing image and icons (next/og draws with literal colours). Parsing the stylesheet rather than
// copying the values keeps one source, and an unreadable palette fails the build instead of shipping
// grey images.

const TOKENS = ["bg", "fg", "muted", "accent"] as const;

/** The colours the generated images draw with, each as "#rrggbb". */
export type ThemeTokens = Record<(typeof TOKENS)[number], string>;

/**
 * The dark theme's tokens (the images are always dark, like the site's default). Throws naming the
 * first token it can't read.
 */
export function parseThemeTokens(css: string): ThemeTokens {
  const block = darkBlock(css);
  const tokens = {} as ThemeTokens;
  for (const token of TOKENS) {
    const value = block.match(new RegExp(`--${token}\\s*:\\s*([^;]+);`))?.[1];
    const hex = value === undefined ? undefined : toHex(value.trim());
    if (hex === undefined) {
      throw new Error(
        `app/globals.css: --${token} in the dark theme is ${value === undefined ? "missing" : `"${value.trim()}", not a hex or rgb() colour`}.`,
      );
    }
    tokens[token] = hex;
  }
  return tokens;
}

function darkBlock(css: string): string {
  // The selector list may hold other selectors too (dark shares its block with :root).
  const selector = '[data-theme="dark"]';
  for (const [, selectors, body] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (selectors.split(",").some((part) => part.trim() === selector)) {
      return body;
    }
  }
  return "";
}

/** "#aabbcc", "rgb(16 15 15)" or "rgb(16, 15, 15)" → "#rrggbb"; anything else → undefined. */
function toHex(value: string): string | undefined {
  if (/^#[0-9a-f]{6}$/i.test(value)) return value.toLowerCase();
  const rgb = value.match(/^rgb\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)\s*\)$/);
  if (!rgb) return undefined;
  const channels = rgb.slice(1).map(Number);
  if (channels.some((channel) => channel > 255)) return undefined;
  return `#${channels.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}
