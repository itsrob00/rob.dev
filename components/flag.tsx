import type { ReactNode } from "react";
import type { FlagRegion } from "@/lib/language-versions";
import styles from "./flag.module.css";

const US_STRIPE_HEIGHT = 20 / 13;

const ART = {
  US: (
    <>
      <rect width="30" height="20" fill="#fff" />
      {[0, 2, 4, 6, 8, 10, 12].map((stripe) => (
        <rect
          key={stripe}
          y={stripe * US_STRIPE_HEIGHT}
          width="30"
          height={US_STRIPE_HEIGHT}
          fill="#b22234"
        />
      ))}
      <rect width="12" height={7 * US_STRIPE_HEIGHT} fill="#3c3b6e" />
    </>
  ),
  IT: (
    <>
      <rect width="10" height="20" fill="#009246" />
      <rect x="10" width="10" height="20" fill="#fff" />
      <rect x="20" width="10" height="20" fill="#ce2b37" />
    </>
  ),
} satisfies Record<FlagRegion, ReactNode>;

export function Flag({ region }: { region: FlagRegion }) {
  return (
    <svg
      viewBox="0 0 30 20"
      aria-hidden="true"
      focusable="false"
      className={styles.flag}
    >
      {ART[region]}
    </svg>
  );
}
