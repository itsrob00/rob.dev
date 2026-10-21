import { renderMonogram } from "@/lib/share-images";

export const dynamic = "force-static";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return renderMonogram(size.width);
}
