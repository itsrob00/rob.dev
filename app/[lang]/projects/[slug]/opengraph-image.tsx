import {
  languageVersion,
  publishedLanguageVersions,
} from "@/lib/language-versions";
import { getProject, getProjects } from "@/lib/projects";
import { projectCard } from "@/lib/site-metadata";
import { renderShareCard } from "@/lib/share-images";

// One PNG per Project at /<lang>/projects/<slug>/opengraph-image. Static export needs this file's own
// generateStaticParams, with every segment: it isn't inherited from the page or the layout. Its
// og:image tags come from pageMetadata.
export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return publishedLanguageVersions().flatMap(({ code }) =>
    getProjects(code).map(({ slug }) => ({ lang: code, slug })),
  );
}

export default async function Image({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  const project = getProject(languageVersion(lang).code, slug);
  if (!project) throw new Error("No such Project");
  return renderShareCard(projectCard(project));
}
