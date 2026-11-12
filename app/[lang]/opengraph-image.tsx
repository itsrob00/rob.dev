import { languageParams, languageVersion } from "@/lib/language-versions";
import { homeCard } from "@/lib/site-metadata";
import { renderShareCard } from "@/lib/share-images";

// Static export builds this to a PNG at /<lang>/opengraph-image. Its og:image tags come from pageMetadata.
export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return languageParams();
}

export default async function Image({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  return renderShareCard(homeCard(languageVersion((await params).lang).code));
}
