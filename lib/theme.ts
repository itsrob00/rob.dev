export type Theme = "dark" | "light";

/** Every first visit is dark, whatever the OS prefers. */
export const DEFAULT_THEME: Theme = "dark";

const STORAGE_KEY = "theme";

export function readStoredTheme(): Theme {
  try {
    return localStorage.getItem(STORAGE_KEY) === "light" ? "light" : "dark";
  } catch {
    return DEFAULT_THEME;
  }
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
}

export function saveTheme(theme: Theme) {
  applyTheme(theme);
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Storage blocked (private mode, strict settings): the choice lasts until reload.
  }
}

/**
 * Inlined in <head> so the stored choice is on <html> before the first paint,
 * long before React loads. Same logic as readStoredTheme and applyTheme.
 */
export const themeScript = `try{if(localStorage.getItem(${JSON.stringify(STORAGE_KEY)})==="light")document.documentElement.dataset.theme="light"}catch(e){}`;
