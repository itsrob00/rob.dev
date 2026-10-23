import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Anchor } from "@/components/anchor";
import { OneColumnPage } from "@/components/one-column-page";
import { RepoPreviewCard } from "@/components/repo-preview";
import { SharedTitle } from "@/components/route-transition";
import { StackTags } from "@/components/stack-tags";
import { formatDateRange } from "@/lib/date-range";
import { dictionary } from "@/lib/dictionaries";
import { languageVersion } from "@/lib/language-versions";
import {
  getProject,
  getProjects,
  loadProjectBody,
  projectKicker,
} from "@/lib/projects";
import { pageMetadata, projectCard } from "@/lib/site-metadata";
import styles from "./page.module.css";

// Static export: one page per Project, and any other slug is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return getProjects().map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/projects/[slug]">): Promise<Metadata> {
  const { lang, slug } = await params;
  const project = getProject(slug);
  const version = languageVersion(lang);
  return project
    ? pageMetadata({
        version,
        path: project.href,
        title: project.title,
        description: project.summary,
        card: projectCard(project, version.code),
      })
    : {};
}

export default async function ProjectPage({
  params,
}: PageProps<"/[lang]/projects/[slug]">) {
  const { lang, slug } = await params;
  const { code } = languageVersion(lang);
  const project = getProject(slug);
  if (!project) notFound();
  const Body = await loadProjectBody(project);
  const { repo, live } = project.links;
  const t = dictionary(code).project;

  return (
    <OneColumnPage lang={code}>
      <article>
        <header className={styles.header}>
          <p className={styles.kicker}>{projectKicker(project, code)}</p>
          <h1 className={styles.title}>
            <SharedTitle slug={project.slug}>{project.title}</SharedTitle>
          </h1>
          <p className={styles.summary}>{project.summary}</p>
          <dl className={styles.facts}>
            <div>
              <dt>{t.role}</dt>
              <dd>{project.role}</dd>
            </div>
            <div>
              <dt>{t.when}</dt>
              <dd>{formatDateRange(project, "month", code)}</dd>
            </div>
          </dl>
          <StackTags lang={code} stack={project.stack} />
          <p className={styles.links}>
            {repo && <Anchor href={repo}>{t.repository}</Anchor>}
            {live && <Anchor href={live}>{t.live}</Anchor>}
          </p>
          {project.cover && (
            // Static export has no image optimizer; covers are pre-sized under public/.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className={styles.cover}
              src={project.cover.src}
              alt={project.cover.alt}
            />
          )}
        </header>
        <div className={styles.prose}>
          <Body />
        </div>
        <RepoPreviewCard lang={code} project={project} />
      </article>
    </OneColumnPage>
  );
}
