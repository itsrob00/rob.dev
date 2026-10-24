type Card = { readonly slug: string; readonly stack: readonly string[] };

/** What the Work section's highlight remembers. A chip is named by its technology, a card by its slug. */
export type HighlightState = {
  readonly pinned: string | null;
  readonly chipHover: string | null;
  readonly cardHover: Card | null;
  readonly cardFocus: Card | null;
};

export const idle: HighlightState = {
  pinned: null,
  chipHover: null,
  cardHover: null,
  cardFocus: null,
};

export type HighlightEvent =
  | { type: "chip-press"; name: string }
  | { type: "chip-enter"; name: string }
  | { type: "chip-leave"; name: string }
  | { type: "card-enter"; card: Card }
  | { type: "card-leave"; slug: string }
  | { type: "card-focus"; card: Card }
  | { type: "card-blur"; slug: string }
  | { type: "escape" };

export function reduceHighlight(
  state: HighlightState,
  event: HighlightEvent,
): HighlightState {
  switch (event.type) {
    case "chip-press":
      // Unpinning also ends the chip's own preview, or the click would seem to do nothing.
      return state.pinned === event.name
        ? { ...state, pinned: null, chipHover: null }
        : { ...state, pinned: event.name };
    case "chip-enter":
      return { ...state, chipHover: event.name };
    // A leave clears only what it names: a late one must not undo the next enter.
    case "chip-leave":
      return state.chipHover === event.name
        ? { ...state, chipHover: null }
        : state;
    case "card-enter":
      return { ...state, cardHover: event.card };
    case "card-leave":
      return state.cardHover?.slug === event.slug
        ? { ...state, cardHover: null }
        : state;
    case "card-focus":
      return { ...state, cardFocus: event.card };
    case "card-blur":
      return state.cardFocus?.slug === event.slug
        ? { ...state, cardFocus: null }
        : state;
    case "escape":
      return { ...state, pinned: null };
  }
}

type Highlight =
  | { kind: "none" }
  | { kind: "technology"; name: string }
  | { kind: "project"; stack: readonly string[] };

function current(state: HighlightState): Highlight {
  const name = state.chipHover ?? state.pinned;
  if (name !== null) return { kind: "technology", name };
  const card = state.cardHover ?? state.cardFocus;
  if (card !== null) return { kind: "project", stack: card.stack };
  return { kind: "none" };
}

/** A card dims while a technology it doesn't use is highlighted. */
export function isCardDimmed(
  state: HighlightState,
  stack: readonly string[],
): boolean {
  const highlight = current(state);
  return highlight.kind === "technology" && !stack.includes(highlight.name);
}

/** A chip dims while a Project that doesn't use it is highlighted. */
export function isChipDimmed(state: HighlightState, name: string): boolean {
  const highlight = current(state);
  return highlight.kind === "project" && !highlight.stack.includes(name);
}
