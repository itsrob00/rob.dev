import fs from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";
import { parseThemeTokens } from "../lib/theme-tokens";

const globalsCss = fs.readFileSync(
  path.join(import.meta.dirname, "..", "app", "globals.css"),
  "utf8",
);

describe("parseThemeTokens", () => {
  test("reads the dark palette from the site's stylesheet as hex", () => {
    expect(parseThemeTokens(globalsCss)).toEqual({
      bg: "#100f0f",
      fg: "#ece9e4",
      muted: "#8b8680",
      accent: "#4ade80",
    });
  });

  test("fails naming the token when one is missing", () => {
    const css = `[data-theme="dark"] { --bg: #000000; --fg: #ffffff; --muted: #888888; }`;
    expect(() => parseThemeTokens(css)).toThrow("--accent");
  });

  test("fails on a colour format it can't turn into hex", () => {
    const css = `[data-theme="dark"] { --bg: oklch(0.2 0 0); --fg: #ffffff; --muted: #888888; --accent: #00ff00; }`;
    expect(() => parseThemeTokens(css)).toThrow("--bg");
  });
});
