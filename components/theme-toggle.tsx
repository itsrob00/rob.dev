"use client";

import { useLayoutEffect, useSyncExternalStore } from "react";
import {
  applyTheme,
  DEFAULT_THEME,
  readStoredTheme,
  saveTheme,
  type Theme,
} from "@/lib/theme";
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

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getTheme, getServerTheme);
  const next: Theme = theme === "dark" ? "light" : "dark";

  // In development, Strict Mode's remount clears the attribute the head script set. No-op in production.
  useLayoutEffect(() => {
    applyTheme(readStoredTheme());
  }, []);

  return (
    <button
      type="button"
      className={styles.toggle}
      aria-label={`Switch to ${next} theme`}
      onClick={() => saveTheme(next)}
    >
      {/* Which symbol is lit comes from CSS on <html data-theme>, so it's right before hydration too. */}
      <span aria-hidden="true" className={styles.dark}>
        ☾
      </span>
      <span aria-hidden="true">/</span>
      <span aria-hidden="true" className={styles.light}>
        ☀
      </span>
    </button>
  );
}
