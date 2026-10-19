import { homeCard } from "@/lib/site-metadata";
import { renderShareCard } from "@/lib/share-images";

// Static export builds this to a PNG at /opengraph-image. Its og:image tags come from pageMetadata.
export const dynamic = "force-static";

export default function Image() {
  return renderShareCard(homeCard);
}
