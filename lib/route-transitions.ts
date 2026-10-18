/**
 * The route-transition vocabulary, the only place these names are spelled in TypeScript.
 *
 * A transition type a link carries is also the view-transition-class both pages get for it, so
 * there's no type → class table to keep in step: components/route-transition.css tells the leaving
 * page from the arriving one by pseudo-element (`::view-transition-old(.nav-forward)` vs `-new`).
 * That stylesheet is the only other place the names appear; tests/route-transitions.test.ts fails
 * when the two disagree.
 */
export const ROUTE_TRANSITIONS = {
  /** Types links carry, by direction: home is the top, everything else is one level down. */
  nav: { forward: "nav-forward", back: "nav-back" },
  /** The class a navigation with no type gets: a crossfade. */
  untyped: "crossfade",
  /** The class a shared element (a Project title) gets: the morph. */
  morph: "morph",
} as const;

/** "forward": deeper (home → Project, home → Résumé). "back": up to home (the "← Rob" links). */
export type NavDirection = keyof typeof ROUTE_TRANSITIONS.nav;

/** What route-transition.css must style, grouped by the pseudo-elements each class needs. */
export const STYLED_CLASSES = {
  /** Each needs ::view-transition-old(.x) and ::view-transition-new(.x). */
  page: [
    ROUTE_TRANSITIONS.nav.forward,
    ROUTE_TRANSITIONS.nav.back,
    ROUTE_TRANSITIONS.untyped,
  ],
  /** Each needs ::view-transition-group(.x). */
  shared: [ROUTE_TRANSITIONS.morph],
} as const;
