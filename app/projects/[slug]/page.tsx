import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OneColumnPage } from "@/components/one-column-page";
import { SharedTitle } from "@/components/route-transition";
import { StackTags } from "@/components/stack-tags";
import { formatDateRange } from "@/lib/date-range";
import { getProject, getProjects, loadProjectBody } from "@/lib/projects";
import { pageMetadata, projectCard } from "@/lib/site-metadata";
import styles from "./page.module.css";

// Static export: one page per Project, and any other slug is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return getProjects().map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const project = getProject((await params).slug);
  return project
    ? pageMetadata({
        path: project.href,
        title: project.title,
        description: project.summary,
        card: projectCard(project),
      })
    : {};
}

export default async function ProjectPage({
  params,
}: PageProps<"/projects/[slug]">) {
  const project = getProject((await params).slug);
  if (!project) notFound();
  const Body = await loadProjectBody(project);
  const { repo, live } = project.links;

  return (
    <OneColumnPage>
      <article>
        <header className={styles.header}>
          <p className={styles.kicker}>{project.kicker}</p>
          <h1 className={styles.title}>
            <SharedTitle slug={project.slug}>{project.title}</SharedTitle>
          </h1>
          <p className={styles.summary}>{project.summary}</p>
          <dl className={styles.facts}>
            <div>
              <dt>Role</dt>
              <dd>{project.role}</dd>
            </div>
            <div>
              <dt>When</dt>
              <dd>{formatDateRange(project, "month")}</dd>
            </div>
          </dl>
          <StackTags stack={project.stack} />
          <p className={styles.links}>
            {repo && <a href={repo}>Repository ↗</a>}
            {live && <a href={live}>Live site ↗</a>}
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
      </article>
    </OneColumnPage>
  );
}
