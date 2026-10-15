import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fully static: every route is prerendered into out/, and the build fails if one stops being static.
  output: "export",
  // create-next-app turns this on, and it breaks static export.
  cacheComponents: false,
};

export default nextConfig;
