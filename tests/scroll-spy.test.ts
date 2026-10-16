import { expect, test } from "vitest";
import { pickActiveSection } from "../lib/scroll-spy";

const ids = ["about", "work", "experience", "stack"] as const;

// offsets: each section's distance below the line a nav click scrolls it to.
const at = (offsets: number[]) =>
  ids.map((id, i) => ({ id, offset: offsets[i] }));

const midPage = { scrollY: 600, viewportHeight: 800, documentHeight: 3000 };

test("marks the first section at the top of the page", () => {
  expect(
    pickActiveSection(at([0, 400, 900, 1400]), {
      scrollY: 0,
      viewportHeight: 800,
      documentHeight: 3000,
    }),
  ).toBe("about");
});

test("marks the last section whose heading has reached the line", () => {
  expect(pickActiveSection(at([-700, -50, 300, 900]), midPage)).toBe("work");
});

test("marks the clicked section once a nav click lands it on the line", () => {
  expect(pickActiveSection(at([-1200, -500, 0, 600]), midPage)).toBe(
    "experience",
  );
  // Smooth scrolling and zoom can stop a pixel or two short.
  expect(pickActiveSection(at([-900, -300, 1.5, 500]), midPage)).toBe(
    "experience",
  );
});

test("marks the last section at the bottom of the page, even below the line", () => {
  expect(
    pickActiveSection(at([-1800, -1200, -600, 300]), {
      scrollY: 1100,
      viewportHeight: 800,
      documentHeight: 1900,
    }),
  ).toBe("stack");
});

test("keeps the first section when the whole page fits on screen", () => {
  expect(
    pickActiveSection(at([0, 100, 200, 300]), {
      scrollY: 0,
      viewportHeight: 800,
      documentHeight: 800,
    }),
  ).toBe("about");
});
