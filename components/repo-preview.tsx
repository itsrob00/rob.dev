import type { Project } from "@/lib/projects";
import { getRepoPreview } from "@/lib/repo-previews";
import styles from "./repo-preview.module.css";

export function RepoPreviewCard({
  project,
}: {
  project: Pick<Project, "slug" | "links">;
}) {
  const preview = getRepoPreview(project);
  if (!preview) return null;
  return (
    <a
      className={styles.card}
      href={preview.href}
      aria-label={`${preview.name} on GitHub`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className={styles.image}
        src={preview.image}
        alt=""
        loading="lazy"
        decoding="async"
      />
      <span className={styles.strip}>
        <span className={styles.name}>{preview.name}</span>
        <span className={styles.host}>github.com</span>
      </span>
    </a>
  );
}
