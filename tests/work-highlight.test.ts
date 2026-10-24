import { describe, expect, test } from "vitest";
import {
  idle,
  isCardDimmed,
  isChipDimmed,
  reduceHighlight,
  type HighlightEvent,
  type HighlightState,
} from "../lib/work-highlight";

const devflow = { slug: "devflow", stack: ["Claude Code", "Node.js"] };
const exolab = { slug: "exolab", stack: ["React", "TypeScript"] };

function run(...events: HighlightEvent[]): HighlightState {
  return events.reduce(reduceHighlight, idle);
}

describe("pressing a chip", () => {
  test("pins its technology: cards that don't use it dim, chips stay lit", () => {
    const state = run({ type: "chip-press", name: "React" });
    expect(state.pinned).toBe("React");
    expect(isCardDimmed(state, devflow.stack)).toBe(true);
    expect(isCardDimmed(state, exolab.stack)).toBe(false);
    expect(isChipDimmed(state, "Claude Code")).toBe(false);
  });

  test("again clears the pin", () => {
    const state = run(
      { type: "chip-press", name: "React" },
      { type: "chip-press", name: "React" },
    );
    expect(state.pinned).toBeNull();
    expect(isCardDimmed(state, devflow.stack)).toBe(false);
  });

  test("again clears the highlight at once, though the pointer is still on the chip", () => {
    const state = run(
      { type: "chip-enter", name: "React" },
      { type: "chip-press", name: "React" },
      { type: "chip-press", name: "React" },
    );
    expect(isCardDimmed(state, devflow.stack)).toBe(false);
  });

  test("another one moves the pin there", () => {
    const state = run(
      { type: "chip-press", name: "React" },
      { type: "chip-press", name: "Claude Code" },
    );
    expect(state.pinned).toBe("Claude Code");
    expect(isCardDimmed(state, exolab.stack)).toBe(true);
  });
});

describe("pointing at a card", () => {
  test("dims the chips it doesn't use, and no card", () => {
    const state = run({ type: "card-enter", card: devflow });
    expect(isChipDimmed(state, "React")).toBe(true);
    expect(isChipDimmed(state, "Claude Code")).toBe(false);
    expect(isCardDimmed(state, exolab.stack)).toBe(false);
  });

  test("with the keyboard does the same", () => {
    const state = run({ type: "card-focus", card: devflow });
    expect(isChipDimmed(state, "React")).toBe(true);
  });

  test("ends when the pointer leaves it", () => {
    const state = run(
      { type: "card-enter", card: devflow },
      { type: "card-leave", slug: "devflow" },
    );
    expect(isChipDimmed(state, "React")).toBe(false);
  });

  test("ends when focus leaves it", () => {
    const state = run(
      { type: "card-focus", card: devflow },
      { type: "card-blur", slug: "devflow" },
    );
    expect(isChipDimmed(state, "React")).toBe(false);
  });
});

describe("hovering a chip", () => {
  test("previews its technology without pinning it", () => {
    const state = run({ type: "chip-enter", name: "React" });
    expect(isCardDimmed(state, devflow.stack)).toBe(true);
    expect(state.pinned).toBeNull();
  });

  test("ends when the pointer leaves it", () => {
    const state = run(
      { type: "chip-enter", name: "React" },
      { type: "chip-leave", name: "React" },
    );
    expect(isCardDimmed(state, devflow.stack)).toBe(false);
  });
});

describe("when several things point at once", () => {
  test("a pin holds while the pointer crosses the cards", () => {
    const state = run(
      { type: "chip-press", name: "React" },
      { type: "card-enter", card: devflow },
    );
    expect(isCardDimmed(state, devflow.stack)).toBe(true);
    expect(isChipDimmed(state, "React")).toBe(false);
  });

  test("hovering another chip previews it over the pin", () => {
    const state = run(
      { type: "chip-press", name: "React" },
      { type: "chip-enter", name: "Claude Code" },
    );
    expect(isCardDimmed(state, devflow.stack)).toBe(false);
    expect(isCardDimmed(state, exolab.stack)).toBe(true);
  });

  test("the pointer leaving a card keeps the card that still has keyboard focus", () => {
    const state = run(
      { type: "card-focus", card: devflow },
      { type: "card-enter", card: devflow },
      { type: "card-leave", slug: "devflow" },
    );
    expect(isChipDimmed(state, "React")).toBe(true);
  });
});

describe("a late leave", () => {
  test("from a card the pointer already left doesn't clear the card it entered next", () => {
    const state = run(
      { type: "card-enter", card: exolab },
      { type: "card-enter", card: devflow },
      { type: "card-leave", slug: "exolab" },
    );
    expect(isChipDimmed(state, "React")).toBe(true);
    expect(isChipDimmed(state, "Claude Code")).toBe(false);
  });

  test("from a chip the pointer already left doesn't clear the next chip's preview", () => {
    const state = run(
      { type: "chip-enter", name: "React" },
      { type: "chip-enter", name: "Claude Code" },
      { type: "chip-leave", name: "React" },
    );
    expect(isCardDimmed(state, exolab.stack)).toBe(true);
  });

  test("from a blurred card doesn't clear the card focused next", () => {
    const state = run(
      { type: "card-focus", card: exolab },
      { type: "card-focus", card: devflow },
      { type: "card-blur", slug: "exolab" },
    );
    expect(isChipDimmed(state, "React")).toBe(true);
  });
});

test("Esc clears the pin", () => {
  const state = run({ type: "chip-press", name: "React" }, { type: "escape" });
  expect(state.pinned).toBeNull();
});

test("nothing is dimmed before anyone points at anything", () => {
  expect(isCardDimmed(idle, devflow.stack)).toBe(false);
  expect(isChipDimmed(idle, "React")).toBe(false);
});
