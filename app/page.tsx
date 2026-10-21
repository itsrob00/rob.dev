import type { Metadata } from "next";
import type { ReactNode } from "react";
import {
  About,
  ExperienceList,
  SelectedWork,
  StackList,
} from "@/components/home-sections";
import { IdentityColumn } from "@/components/identity-column";
import { FadeUp } from "@/components/motion";
import { PrivacyNotice } from "@/components/privacy-notice";
import { PageTransition } from "@/components/route-transition";
import type { NavItem } from "@/components/section-nav";
import { profile } from "@/content/profile";
import { personJsonLd } from "@/lib/person-json-ld";
import { homeCard, pageMetadata } from "@/lib/site-metadata";
import styles from "./page.module.css";

// No title: home takes the layout's default.
export const metadata: Metadata = pageMetadata({
  path: "/",
  description: profile.blurb,
  card: homeCard,
});

// id: the element id, URL hash and nav link target. title: the <h2> and the nav label.
type HomeSection = NavItem & {
  Body: () => ReactNode;
};

// The one list of home sections: <main> renders it in order and the nav lists each one.
const sections = [
  { id: "about", title: "About", Body: About },
  { id: "stack", title: "Stack", Body: StackList },
  { id: "work", title: "Selected Work", Body: SelectedWork },
  { id: "experience", title: "Experience", Body: ExperienceList },
] satisfies readonly HomeSection[];

// Only plain data crosses to the client nav: Body is a function and can't.
const nav = sections.map(({ id, title }) => ({ id, title }));

export default function Home() {
  return (
    <PageTransition>
      {/* Home only: the Person behind the site, for search engines. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: personJsonLd(profile) }}
      />
      <div className={styles.grid}>
        <IdentityColumn nav={nav} />
        <main className={styles.main}>
          {sections.map(({ id, title, Body }) => (
            <section
              key={id}
              id={id}
              aria-labelledby={`${id}-title`}
              className={styles.section}
            >
              {/* The content rises, not the <section>: scroll-spy measures where sections are. */}
              <FadeUp inView>
                <h2 id={`${id}-title`} className={styles.title}>
                  {title}
                </h2>
                <Body />
              </FadeUp>
            </section>
          ))}
          <PrivacyNotice />
        </main>
      </div>
    </PageTransition>
  );
}
