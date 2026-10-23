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
import { profile, profileCopy } from "@/content/profile";
import { languageVersion, type LanguageCode } from "@/lib/language-versions";
import { personJsonLd } from "@/lib/person-json-ld";
import { homeCard, pageMetadata } from "@/lib/site-metadata";
import styles from "./page.module.css";

// No title: home takes the layout's default.
export async function generateMetadata({
  params,
}: PageProps<"/[lang]">): Promise<Metadata> {
  const version = languageVersion((await params).lang);
  return pageMetadata({
    version,
    path: "/",
    description: profileCopy[version.code].blurb,
    card: homeCard(version.code),
  });
}

// id: the element id, URL hash and nav link target. title: the <h2> and the nav label.
type HomeSection = NavItem & {
  Body: (props: { lang: LanguageCode }) => ReactNode;
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

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { code } = languageVersion((await params).lang);
  return (
    <PageTransition>
      {/* Home only: the Person behind the site, for search engines. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: personJsonLd({ ...profile, ...profileCopy[code] }),
        }}
      />
      <div className={styles.grid}>
        <IdentityColumn lang={code} nav={nav} />
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
                <Body lang={code} />
              </FadeUp>
            </section>
          ))}
          <PrivacyNotice />
        </main>
      </div>
    </PageTransition>
  );
}
