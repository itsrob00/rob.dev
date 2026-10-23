import { profile } from "@/content/profile";
import { dictionary } from "@/lib/dictionaries";
import type { LanguageCode } from "@/lib/language-versions";
import { Anchor } from "./anchor";
import styles from "./privacy-notice.module.css";

// The Privacy notice: one muted note at the foot of the home page, kept deliberately short.
export function PrivacyNotice({ lang }: { lang: LanguageCode }) {
  const t = dictionary(lang);
  return (
    <footer id="privacy" aria-label={t.privacy} className={styles.notice}>
      <p>
        <span className={styles.label}>{t.privacy} ·</span>{" "}
        {t.privacyText(
          <Anchor href={`mailto:${profile.email}`} className={styles.link}>
            {profile.email}
          </Anchor>,
        )}
      </p>
    </footer>
  );
}
