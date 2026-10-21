"use client";

import {
  MotionConfig,
  motion,
  stagger as staggerBy,
  useAnimate,
  useInView,
  useReducedMotion,
} from "motion/react";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import styles from "./motion.module.css";

// The site's in-page motion. Each component carries its own reduced-motion handling, so a caller
// can't forget a provider or a hook.

/**
 * Where a FadeUp is, rendered as data-phase for motion.module.css:
 *   pending  the server HTML and the first client render (identical, so hydration matches). Hidden
 *            by CSS only when motion is welcome and scripting is on, with a fail-safe that reveals
 *            it if JS never takes over.
 *   armed    JS owns it: still hidden, fail-safe off, waiting to rise.
 *   shown    nothing hides it.
 * It only moves forward (pending → armed → shown, or pending → shown), so a FadeUp never hides
 * content that is already visible.
 */
type Phase = "pending" | "armed" | "shown";

/** The rise. The hidden pose it starts from is also motion.module.css's. */
const RISE = { opacity: [0, 1], y: [16, 0] };
const RISE_SECONDS = 0.5;
const STAGGER_SECONDS = 0.08;

/**
 * Content that rises into place: on arrival, or with `inView` the first time its top passes the
 * line 10% above the viewport's bottom edge; with `stagger` its direct children rise one after
 * another instead of itself. A line, not a share of the content: a tall block's heading must not
 * sit on screen invisible while too little of the block shows.
 *
 * On a page reached through a route transition nothing rises until the transition has finished; on
 * a first load or a browser back it rises at once.
 *
 * Reduced motion is decided by the stylesheet alone: CSS hides the content only when motion is
 * welcome, and the mount checks whether it's hidden. If not (reduced motion, no JS support for the
 * media query, or the fail-safe fired), it's shown without animating. Rendering a different element
 * under useReducedMotion() instead would mismatch the prerendered HTML.
 */
export function FadeUp({
  children,
  inView = false,
  stagger = false,
  as: Tag = "div",
  className,
}: {
  children: ReactNode;
  inView?: boolean;
  stagger?: boolean;
  /** "header" lets the Identity column be its own stagger container. */
  as?: "div" | "header";
  className?: string;
}) {
  // Typed as a div so it fits both tags' ref; only HTMLElement members are used.
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const [phase, setPhase] = useState<Phase>("pending");
  const arrival = useRef<Promise<void>>(null);
  const seen = useInView(scope, { once: true, margin: "0px 0px -10% 0px" });

  // A layout effect, because routeArrival must be read while the route transition's DOM update is
  // still running (see there).
  useLayoutEffect(() => {
    const [first] = targetsOf(scope.current, stagger);
    if (!first || getComputedStyle(first).opacity !== "0") {
      setPhase("shown");
      return;
    }
    arrival.current = routeArrival();
    setPhase("armed");
  }, [scope, stagger]);

  useEffect(() => {
    if (phase !== "armed" || (inView && !seen)) return;
    let live = true;
    arrival
      .current!.then(() => {
        if (!live) return;
        return animate(targetsOf(scope.current, stagger), RISE, {
          duration: RISE_SECONDS,
          ease: "easeOut",
          delay: stagger ? staggerBy(STAGGER_SECONDS) : 0,
        });
      })
      .then(() => {
        if (live) setPhase("shown");
      });
    return () => {
      live = false;
    };
  }, [phase, inView, seen, stagger, animate, scope]);

  return (
    <Tag
      ref={scope}
      data-phase={phase}
      className={[stagger ? styles.children : styles.self, className]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </Tag>
  );
}

/** The elements that rise: the FadeUp itself, or its direct children when staggering. */
function targetsOf(element: HTMLElement | null, stagger: boolean) {
  if (!element) return [];
  return stagger
    ? [...element.children].filter((child) => child instanceof HTMLElement)
    : [element];
}

/** Insurance only, well above the longest transition (350ms): the trigger is the transition's end. */
const ARRIVAL_CEILING_MS = 2000;

/**
 * Settles when the route transition the caller is mounting inside has finished, or at once if there
 * is none. Never rejects.
 *
 * React runs a navigation's DOM changes and layout effects inside startViewTransition's update
 * callback, so a component mounting through a route transition sees it in
 * document.activeViewTransition. A first load, a browser back (React doesn't animate traversals) or
 * a browser without View Transitions has none. Browsers with View Transitions but without
 * activeViewTransition rise during the slide.
 */
function routeArrival(): Promise<void> {
  const transition = document.activeViewTransition;
  if (!transition) return Promise.resolve();
  return new Promise<void>((resolve) => {
    const ceiling = setTimeout(resolve, ARRIVAL_CEILING_MS);
    const done = () => {
      clearTimeout(ceiling);
      resolve();
    };
    transition.finished.then(done, done);
  });
}

/**
 * A list item (a Selected Work card) that rises 4px while hovered. Under reduced motion it doesn't move at all.
 * The glow (border, shadow) is the caller's CSS, under its own reduced-motion guard: it isn't a
 * transform. The caller's CSS must not also set or transition `transform` on it.
 */
export function LiftItem({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  // whileHover renders nothing on the server, so this can't mismatch the prerendered HTML.
  const reduce = useReducedMotion();
  return (
    <motion.li
      className={className}
      whileHover={reduce ? undefined : { y: -4 }}
      transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
    >
      {children}
    </motion.li>
  );
}

/**
 * A span that, when it unmounts in one place and mounts in another with the same `id`, slides
 * between the two (the scroll-spy marker). Under reduced motion it jumps. The caller's className
 * positions and paints it. At most one per id may be mounted at a time.
 */
export function Glide({ id, className }: { id: string; className?: string }) {
  return (
    <MotionConfig reducedMotion="user">
      <motion.span
        layoutId={id}
        className={className}
        transition={{ type: "spring", stiffness: 400, damping: 35 }}
      />
    </MotionConfig>
  );
}
