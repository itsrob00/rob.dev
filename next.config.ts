import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const nextConfig: NextConfig = {
  // Fully static: every route is prerendered into out/, and the build fails if one stops being static.
  output: "export",
  // create-next-app turns this on, and it breaks static export.
  cacheComponents: false,
};

// Project bodies are imported from content/projects/, never routed, so pageExtensions stays default.
const withMDX = createMDX({
  options: {
    // By name, as Turbopack requires. It only keeps the YAML block out of the rendered body:
    // lib/projects.ts reads the frontmatter itself.
    remarkPlugins: ["remark-frontmatter"],
  },
});

export default withMDX(nextConfig);
