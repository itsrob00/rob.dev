import { profile } from "@/content/profile";
import styles from "./privacy-notice.module.css";

// The Privacy notice: the last home section, formal and third person (map ticket 12).
// Vercel's data processing addendum may not cover Hobby accounts, so the notice names the EU-US
// Data Privacy Framework and never promises standard contractual clauses.
export function PrivacyNotice() {
  const email = (
    <a href={`mailto:${profile.email}`} className={styles.link}>
      {profile.email}
    </a>
  );

  return (
    <div className={styles.notice}>
      <p>
        This notice explains what personal data is processed when someone visits{" "}
        {new URL(profile.site).host}, as required by Article 13 of the EU
        General Data Protection Regulation (GDPR). The data controller is{" "}
        {profile.name}, who can be contacted at {email}.
      </p>

      <h3 className={styles.heading}>Hosting</h3>
      <p>
        The site is hosted by Vercel Inc. To deliver each page and protect its
        network, Vercel processes the visitor&apos;s IP address, browser details
        and the address of the page requested. The legal basis is the
        controller&apos;s legitimate interest in running a secure website
        (Article 6(1)(f) GDPR). The request logs available to the controller are
        kept for one hour. Vercel keeps its own records as set out in{" "}
        <a
          href="https://vercel.com/legal/privacy-policy"
          className={styles.link}
        >
          its privacy notice
        </a>
        .
      </p>
      <p>
        Vercel processes the data described here, including the analytics below,
        in the United States and other jurisdictions, and is certified under the
        EU-US Data Privacy Framework.
      </p>

      <h3 className={styles.heading}>Analytics</h3>
      <p>
        Vercel Web Analytics counts page views. It sets no cookies. Visits are
        told apart by a hash of the incoming request that is valid for one day,
        so a visitor cannot be recognized across days or across websites. Its
        script reads one value from the browser&apos;s local storage. Vercel
        Speed Insights measures how fast pages load and sends those measurements
        with the page address and the visitor&apos;s device and browser type. It
        also sets no cookies. The legal basis for both is the controller&apos;s
        legitimate interest in knowing how the site is used and how it performs
        (Article 6(1)(f) GDPR). The controller sees page-view counts for the
        past month only.
      </p>

      <h3 className={styles.heading}>Theme preference</h3>
      <p>
        If a visitor switches between the dark and light theme, the choice is
        stored in the browser&apos;s local storage on their own device. It is
        never sent to the controller or to anyone else, and clearing the
        site&apos;s data removes it.
      </p>

      <h3 className={styles.heading}>Visitors&apos; rights</h3>
      <p>
        Visitors have the right to access their personal data, to have it
        corrected or erased, to restrict or object to its processing, and to
        data portability (Articles 15 to 22 GDPR). Requests can be sent to{" "}
        {email}. Analytics data is not linked to a name, so the controller may
        be unable to find a particular visitor&apos;s data (Article 11 GDPR).
      </p>
      <p>
        Visitors also have the right to lodge a complaint with a supervisory
        authority. In Italy, where the controller is based, this is the{" "}
        <a href="https://www.garanteprivacy.it" className={styles.link}>
          Garante per la protezione dei dati personali
        </a>
        .
      </p>

      <p className={styles.updated}>Last updated 21 October 2026.</p>
    </div>
  );
}
