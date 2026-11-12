"use client";

import { usePathname } from "next/navigation";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
} from "react";
import { languageMenu } from "@/lib/language-versions";
import { Anchor } from "./anchor";
import { measureActive, type NavItem } from "./section-nav";
import styles from "./language-menu.module.css";

const GLIDE_MS = 350;

function placeInPage(sections: readonly NavItem[]): string {
  if (window.location.hash || window.scrollY === 0) return window.location.hash;
  const active = measureActive(sections);
  return active ? `#${active}` : "";
}

export function LanguageMenu({
  label,
  sections = [],
  align = "start",
}: {
  label: string;
  sections?: readonly NavItem[];
  align?: "start" | "end";
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [hash, setHash] = useState("");
  const [picked, setPicked] = useState<number | null>(null);
  const root = useRef<HTMLElement>(null);
  const pill = useRef<HTMLButtonElement>(null);
  const listId = useId();

  const entries = languageMenu(pathname, hash);
  const current = entries.find((entry) => entry.current);
  const index = picked ?? entries.findIndex((entry) => entry.current);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      pill.current?.focus();
    };
    const onPointer = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  const pick = (event: MouseEvent, at: number, href: string) => {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    event.preventDefault();
    setPicked(at);
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.setTimeout(() => window.location.assign(href), still ? 0 : GLIDE_MS);
  };

  return (
    <nav aria-label={label} ref={root} className={styles.menu}>
      <button
        ref={pill}
        type="button"
        className={styles.pill}
        aria-label={`${label}: ${current?.code.toUpperCase()}`}
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => {
          setHash(placeInPage(sections));
          setOpen(!open);
        }}
      >
        <span aria-hidden="true" className={styles.dot} />
        {current?.code.toUpperCase()}
        <span aria-hidden="true" className={styles.chevron}>
          ▴
        </span>
      </button>
      <div
        id={listId}
        hidden={!open}
        className={`${styles.list} ${align === "end" ? styles.end : ""}`}
        style={{ "--index": index } as CSSProperties}
      >
        <span aria-hidden="true" className={styles.glider} />
        <ul>
          {entries.map((entry, at) => (
            <li key={entry.code}>
              <Anchor
                href={entry.href}
                hrefLang={entry.code}
                lang={entry.code}
                aria-current={entry.current ? "page" : undefined}
                className={styles.entry}
                onClick={(event) => pick(event, at, entry.href)}
              >
                {entry.name}{" "}
                <span aria-hidden="true" className={styles.code}>
                  {entry.code.toUpperCase()}
                </span>
              </Anchor>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
