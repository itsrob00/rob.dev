import { dictionary } from "@/lib/dictionaries";
import type { LanguageCode } from "@/lib/language-versions";
import { Technology } from "./technology";
import styles from "./stack-tags.module.css";

// A Project's stack as accent pills, on its Selected Work card and its page header.
export function StackTags({
  lang,
  stack,
}: {
  lang: LanguageCode;
  stack: readonly string[];
}) {
  return (
    <ul className={styles.tags} aria-label={dictionary(lang).stack}>
      {stack.map((item) => (
        <li key={item} className={styles.tag}>
          <Technology name={item} markSize={13} />
        </li>
      ))}
    </ul>
  );
}
