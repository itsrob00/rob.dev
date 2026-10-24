import { Technology } from "./technology";
import styles from "./stack-tags.module.css";

// A Project's technologies as accent pills, on its Work card and its page header. Named "Built with",
// since the Work section's "Stack" list is the Stack itself.
export function StackTags({ stack }: { stack: readonly string[] }) {
  return (
    <ul className={styles.tags} aria-label="Built with">
      {stack.map((item) => (
        <li key={item} className={styles.tag}>
          <Technology name={item} markSize={13} />
        </li>
      ))}
    </ul>
  );
}
