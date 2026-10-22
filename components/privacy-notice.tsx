import { profile } from "@/content/profile";
import { Anchor } from "./anchor";
import styles from "./privacy-notice.module.css";

// The Privacy notice: one muted note at the foot of the home page, kept deliberately short.
export function PrivacyNotice() {
  return (
    <footer id="privacy" aria-label="Privacy" className={styles.notice}>
      <p>
        <span className={styles.label}>Privacy ·</span> No cookies. Vercel hosts
        this site and counts visits anonymously, with a hash that resets daily.
        Your theme choice stays in your browser. Questions or GDPR requests:{" "}
        <Anchor href={`mailto:${profile.email}`} className={styles.link}>
          {profile.email}
        </Anchor>
        .
      </p>
    </footer>
  );
}
