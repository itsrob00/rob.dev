"use client";

import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { languageMenu } from "@/lib/language-versions";
import { Anchor } from "./anchor";
import { Flag } from "./flag";
import { measureActive, type NavItem } from "./section-nav";
import styles from "./language-menu.module.css";
import pillStyles from "./pill.module.css";

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
  const root = useRef<HTMLElement>(null);
  const pill = useRef<HTMLButtonElement>(null);
  const listId = useId();

  const entries = languageMenu(pathname, hash);
  const current = entries.find((entry) => entry.current);

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

  return (
    <nav aria-label={label} ref={root} className={styles.menu}>
      <button
        ref={pill}
        type="button"
        className={pillStyles.pill}
        aria-label={`${label}: ${current?.code.toUpperCase()}`}
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => {
          setHash(placeInPage(sections));
          setOpen(!open);
        }}
      >
        {current && <Flag region={current.region} />}
        {current?.code.toUpperCase()}
      </button>
      <div
        id={listId}
        hidden={!open}
        className={`${styles.list} ${align === "end" ? styles.end : ""}`}
      >
        <ul>
          {entries.map((entry) => (
            <li key={entry.code}>
              <Anchor
                href={entry.href}
                hrefLang={entry.code}
                lang={entry.code}
                aria-current={entry.current ? "page" : undefined}
                className={styles.entry}
              >
                <Flag region={entry.region} />
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
