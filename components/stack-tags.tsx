import styles from "./stack-tags.module.css";

// A Project's stack as accent pills, on its Selected Work card and its page header.
export function StackTags({ stack }: { stack: readonly string[] }) {
  return (
    <ul className={styles.tags} aria-label="Stack">
      {stack.map((item) => (
        <li key={item} className={styles.tag}>
          {item}
        </li>
      ))}
    </ul>
  );
}
