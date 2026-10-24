"use client";

import {
  createContext,
  use,
  useEffect,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react";
import {
  idle,
  isCardDimmed,
  isChipDimmed,
  reduceHighlight,
  type HighlightEvent,
  type HighlightState,
} from "@/lib/work-highlight";
import { LiftItem } from "./motion";

// The Work section's highlight: Stack chips light the Projects that use them, and a Project lights
// its chips. The rules are lib/work-highlight.ts; these only report events and paint data-dimmed.
// The cards' content stays server-rendered, passed through as children.

const Highlight = createContext<{
  state: HighlightState;
  dispatch: Dispatch<HighlightEvent>;
} | null>(null);

function useHighlight() {
  const value = use(Highlight);
  if (!value) throw new Error("StackChip and WorkCard go inside WorkHighlight");
  return value;
}

/** Owns the one highlight for its chips and cards. Renders no element of its own. */
export function WorkHighlight({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reduceHighlight, idle);

  // On the document: Safari doesn't focus a button on click, so Esc may come from anywhere.
  useEffect(() => {
    if (state.pinned === null) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") dispatch({ type: "escape" });
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [state.pinned]);

  return <Highlight value={{ state, dispatch }}>{children}</Highlight>;
}

/** A Stack technology as a toggle: pressing pins its highlight, hovering previews it. */
export function StackChip({
  name,
  className,
  children,
}: {
  name: string;
  className?: string;
  children: ReactNode;
}) {
  const { state, dispatch } = useHighlight();
  return (
    <button
      type="button"
      className={className}
      aria-pressed={state.pinned === name}
      data-dimmed={isChipDimmed(state, name) || undefined}
      onClick={() => dispatch({ type: "chip-press", name })}
      // A tap fires pointerenter too, which would leave a preview stuck after the pin clears.
      onPointerEnter={(event) => {
        if (event.pointerType !== "touch")
          dispatch({ type: "chip-enter", name });
      }}
      onPointerLeave={() => dispatch({ type: "chip-leave", name })}
    >
      {children}
    </button>
  );
}

/** A Project card that lights its chips while pointed at, and dims when a technology it lacks is lit. */
export function WorkCard({
  slug,
  stack,
  className,
  children,
}: {
  slug: string;
  stack: readonly string[];
  className?: string;
  children: ReactNode;
}) {
  const { state, dispatch } = useHighlight();
  const card = { slug, stack };
  return (
    <LiftItem
      className={className}
      data-dimmed={isCardDimmed(state, stack) || undefined}
      onPointerEnter={() => dispatch({ type: "card-enter", card })}
      onPointerLeave={() => dispatch({ type: "card-leave", slug })}
      onFocus={() => dispatch({ type: "card-focus", card })}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          dispatch({ type: "card-blur", slug });
      }}
    >
      {children}
    </LiftItem>
  );
}
