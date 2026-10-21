import { renderToStaticMarkup } from "react-dom/server";
import {
  siClaude,
  siJavascript,
  siNodedotjs,
  siReact,
  siRedux,
  siTailwindcss,
  siTypescript,
  siVite,
  siVitest,
} from "simple-icons";
import { describe, expect, test } from "vitest";
import { Technology } from "../components/technology";
import { stack } from "../content/stack";

function render(name: string, markSize = 28) {
  return renderToStaticMarkup(<Technology name={name} markSize={markSize} />);
}

describe("Technology", () => {
  test.each(stack)(
    "%s shows its brand mark, hidden from assistive tech, then its name",
    (item) => {
      const html = render(item);
      expect(html).toMatch(
        /^<svg [^>]*aria-hidden="true"[^>]*>(<path [^>]*><\/path>)+<\/svg>/,
      );
      expect(html.endsWith(`</svg>${item}`)).toBe(true);
    },
  );

  test.each([
    ["React", siReact],
    ["TypeScript", siTypescript],
    ["Redux Toolkit", siRedux],
    ["Tailwind CSS", siTailwindcss],
    ["Vite", siVite],
    ["Vitest", siVitest],
    ["Claude Code", siClaude],
    ["Node.js", siNodedotjs],
    ["JavaScript", siJavascript],
  ])("%s shows its own brand's mark, in the brand's colour", (name, icon) => {
    const html = render(name);
    expect(html).toContain(`d="${icon.path}"`);
    expect(html).toContain(`fill="#${icon.hex}"`);
  });

  test("Playwright keeps its several colours", () => {
    const fills = render("Playwright").match(/fill="#[0-9A-F]{6}"/g);
    expect(new Set(fills)).toEqual(
      new Set([
        'fill="#2D4552"',
        'fill="#E2574C"',
        'fill="#2EAD33"',
        'fill="#D65348"',
        'fill="#1D8D22"',
        'fill="#C04B41"',
      ]),
    );
  });

  test("the mark is drawn at the size asked for", () => {
    expect(render("React", 13)).toMatch(/^<svg [^>]*width="13" height="13"/);
  });

  test.each(["A technology with no mark", "constructor", "__proto__"])(
    "%s shows its name alone",
    (name) => {
      expect(render(name)).toBe(name);
    },
  );
});
