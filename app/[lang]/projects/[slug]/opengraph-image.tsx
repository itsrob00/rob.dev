import { publishedLanguageVersions } from "@/lib/language-versions";
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
    getProjects().map(({ slug }) => ({ lang: code, slug })),
  );
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const project = getProject((await params).slug);
  if (!project) throw new Error("No such Project");
  return renderShareCard(projectCard(project));
}
