"use client";

import { useSyncExternalStore } from "react";
import { pickActiveSection } from "@/lib/scroll-spy";
import styles from "./section-nav.module.css";

export type NavItem = { id: string; title: string };

// Sections move relative to the viewport on scroll and resize, and when the page reflows
// (web fonts arriving late, for one) without either event firing.
function subscribe(onChange: () => void) {
  const reflow = new ResizeObserver(onChange);
  reflow.observe(document.body);
  window.addEventListener("scroll", onChange, { passive: true });
  window.addEventListener("resize", onChange);
  return () => {
    reflow.disconnect();
    window.removeEventListener("scroll", onChange);
    window.removeEventListener("resize", onChange);
  };
}

// The sections' positions are the store: the active id is derived on every read, never kept.
function measureActive(items: readonly NavItem[]) {
  const sections = items.map(({ id }) => {
    const element = document.getElementById(id);
    if (!element) return { id, offset: Infinity };
    // A nav click scrolls a section to its scroll-margin-top, so that's the line it's measured against.
    const line = parseFloat(getComputedStyle(element).scrollMarginTop) || 0;
    return { id, offset: element.getBoundingClientRect().top - line };
  });
  return pickActiveSection(sections, {
    scrollY: window.scrollY,
    viewportHeight: window.innerHeight,
    documentHeight: document.documentElement.scrollHeight,
  });
}

export function SectionNav({ items }: { items: readonly NavItem[] }) {
  // The prerender can't measure, so it marks the first section: right for a load at the top.
  const activeId = useSyncExternalStore(
    subscribe,
    () => measureActive(items),
    () => items[0]?.id,
  );

  return (
    <nav aria-label="Sections" className={styles.nav}>
      <ul>
        {items.map(({ id, title }) => (
          <li key={id}>
            <a
              href={`#${id}`}
              aria-current={id === activeId ? "location" : undefined}
              className={styles.link}
            >
              <span aria-hidden="true" className={styles.tick}>
                {id === activeId && <Marker />}
              </span>
              {title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** The one element that moves between links. Ticket 08 animates it with Motion's layoutId. */
function Marker() {
  return <span className={styles.marker} />;
}
