import type { MDXComponents } from "mdx/types";

// Required by @next/mdx in the App Router. Project bodies are styled by the .prose wrapper on the
// Project page, so no element needs a component of its own.
const components: MDXComponents = {};

export function useMDXComponents(): MDXComponents {
  return components;
}
