import Link from "next/link";
import {
  ViewTransition,
  type ComponentProps,
  type ReactNode,
  type ViewTransitionClassPerType,
} from "react";
import { ROUTE_TRANSITIONS, type NavDirection } from "@/lib/route-transitions";
// Imported here, beside the TSX that names its classes, so it loads on every route that renders a
// PageTransition (all of them).
import "./route-transition.css";

// Server Components throughout: ViewTransition is in React's server build and every prop is data.
// Pages and links never spell a transition type or class; they say "this is a page", "this is a
// Project's title", "this link goes forward or back".

const { nav, untyped, morph } = ROUTE_TRANSITIONS;

// The class a page gets as it enters or exits, by transition type. The same for both, because the
// CSS tells the sides apart by pseudo-element.
const PAGE_CLASS = {
  [nav.forward]: nav.forward,
  [nav.back]: nav.back,
  default: untyped,
} as const satisfies ViewTransitionClassPerType;

// The class a shared element gets, by transition type: it morphs only going forward.
const SHARE_CLASS = {
  [nav.forward]: morph,
  default: "none",
} as const satisfies ViewTransitionClassPerType;

/**
 * The boundary around a page's content, so the page slides (forward or back) or crossfades as it
 * enters and leaves. Pages render it, never layouts: layouts persist, so enter and exit never fire
 * there. Home renders it in app/page.tsx; every other page gets it from OneColumnPage.
 *
 * `default="none"`: updates inside a page (scroll-spy, theme, hover) never animate as a transition.
 * Browsers without View Transitions navigate without animating.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter={PAGE_CLASS} exit={PAGE_CLASS} default="none">
      {children}
    </ViewTransition>
  );
}

/**
 * A Project's title, the same element on its card and its page heading, so going forward from the
 * card it glides and resizes into the heading. Put it inside the heading, around the text or its
 * link. The fit-content span keeps the morph between the two text boxes, not a card-wide h3 and a
 * column-wide h1, which would stretch the glyphs.
 *
 * Forward only: going back, the card is still hidden waiting for its section's fade-up, so a title
 * gliding home would land, vanish, then rise again. Back, it slides out with its page.
 *
 * At most one per slug may be mounted at a time: React throws on two boundaries with one name.
 * `share` stays explicit next to `default="none"`, or the pair silently stops morphing.
 */
export function SharedTitle({
  slug,
  children,
}: {
  slug: string;
  children: ReactNode;
}) {
  return (
    <ViewTransition name={`title-${slug}`} share={SHARE_CLASS} default="none">
      <span style={{ display: "block", width: "fit-content" }}>{children}</span>
    </ViewTransition>
  );
}

/**
 * A link to another page of the site, the one way route links are written, so each declares which
 * way it goes. Hash links within a page (#work) stay plain <a>: they aren't route changes.
 */
export function NavLink({
  direction,
  ...props
}: ComponentProps<typeof Link> & { direction: NavDirection }) {
  return <Link {...props} transitionTypes={[nav[direction]]} />;
}
