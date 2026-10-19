import fs from "node:fs";
import path from "node:path";
import { expect, test } from "vitest";
import { STYLED_CLASSES } from "../lib/route-transitions";

// CSS can't import the vocabulary, so this keeps the stylesheet and lib/route-transitions.ts from
// drifting apart. It doesn't test how a transition looks: that's checked by eye.
const css = fs.readFileSync(
  path.join(import.meta.dirname, "../components/route-transition.css"),
  "utf8",
);

// Every `::view-transition-<part>(.<class>)` the stylesheet styles, as "<part> <class>".
const styled = new Set(
  [...css.matchAll(/::view-transition-(old|new|group)\(\.([\w-]+)\)/g)].map(
    ([, part, name]) => `${part} ${name}`,
  ),
);

test("every page class styles both the leaving and the arriving page", () => {
  for (const name of STYLED_CLASSES.page) {
    expect(styled).toContain(`old ${name}`);
    expect(styled).toContain(`new ${name}`);
  }
});

test("every shared-element class styles its group", () => {
  for (const name of STYLED_CLASSES.shared) {
    expect(styled).toContain(`group ${name}`);
  }
});

test("the stylesheet styles no class the vocabulary doesn't name", () => {
  const named: string[] = [...STYLED_CLASSES.page, ...STYLED_CLASSES.shared];
  for (const entry of styled) {
    expect(named).toContain(entry.split(" ")[1]);
  }
});

test("reduced motion turns every route animation off, opacity included", () => {
  const reduce = css.match(
    /@media \(prefers-reduced-motion: reduce\) \{([\s\S]*?)\n\}/,
  )?.[1];
  expect(reduce).toBeDefined();
  for (const part of ["group", "old", "new"]) {
    expect(reduce).toContain(`::view-transition-${part}(*)`);
  }
  expect(reduce).toMatch(/animation: none !important/);
});
