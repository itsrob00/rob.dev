"use client";

import { useLayoutEffect, useState, useSyncExternalStore } from "react";
import {
  applyTheme,
  DEFAULT_THEME,
  readStoredTheme,
  saveTheme,
  type Theme,
} from "@/lib/theme";
import pillStyles from "./pill.module.css";
import styles from "./theme-toggle.module.css";

// <html data-theme> is the source of truth: the head script sets it before paint, and the toggle changes it.
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => observer.disconnect();
}

const getTheme = (): Theme =>
  document.documentElement.dataset.theme === "light" ? "light" : "dark";

const getServerTheme = (): Theme => DEFAULT_THEME;

const GLYPH: Record<Theme, string> = { dark: "☾", light: "☀" };

type Roll = { from: Theme; count: number };

export function ThemeToggle({ labels }: { labels: Record<Theme, string> }) {
  const theme = useSyncExternalStore(subscribe, getTheme, getServerTheme);
  const next: Theme = theme === "dark" ? "light" : "dark";
  const [roll, setRoll] = useState<Roll | null>(null);

  // In development, Strict Mode's remount clears the attribute the head script set. No-op in production.
  useLayoutEffect(() => {
    applyTheme(readStoredTheme());
  }, []);

  return (
    <button
      type="button"
      className={pillStyles.pill}
      aria-label={labels[next]}
      onClick={() => {
        setRoll((last) => ({ from: theme, count: (last?.count ?? 0) + 1 }));
        saveTheme(next);
      }}
    >
      <span className={styles.window}>
        <span key={roll?.count} className={roll ? styles.rolling : undefined}>
          {roll && (
            <span aria-hidden="true" className={styles.outgoing}>
              {GLYPH[roll.from]}
            </span>
          )}
          {/* Which symbol shows comes from CSS on <html data-theme>, so it's right before hydration too. */}
          <span aria-hidden="true" className={styles.dark}>
            {GLYPH.dark}
          </span>
          <span aria-hidden="true" className={styles.light}>
            {GLYPH.light}
          </span>
        </span>
      </span>
    </button>
  );
}
