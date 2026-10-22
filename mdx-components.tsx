import type { MDXComponents } from "mdx/types";
import { Anchor } from "@/components/anchor";

// Required by @next/mdx in the App Router. Project bodies are styled by the .prose wrapper on the
// Project page; links go through Anchor so links to other sites open in a new tab.
const components: MDXComponents = {
  a: ({ href = "", ...props }) => <Anchor href={href} {...props} />,
};

export function useMDXComponents(): MDXComponents {
  return components;
}
