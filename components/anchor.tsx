import type { ComponentProps } from "react";
import { profile } from "../content/profile";

type AnchorProps = Omit<ComponentProps<"a">, "href" | "target"> & {
  href: string;
};

const siteHost = new URL(profile.site).hostname;

export function Anchor({ href, rel, ...props }: AnchorProps) {
  const leaves = leavesSite(href);
  return (
    <a
      {...props}
      href={href}
      target={leaves ? "_blank" : undefined}
      rel={withNoopener(rel, leaves)}
    />
  );
}

function leavesSite(href: string) {
  const url = new URL(href, profile.site);
  return (
    (url.protocol === "http:" || url.protocol === "https:") &&
    url.hostname !== siteHost
  );
}

function withNoopener(rel: string | undefined, leaves: boolean) {
  const tokens = new Set(rel?.split(/\s+/).filter(Boolean));
  if (leaves) tokens.add("noopener");
  return tokens.size > 0 ? [...tokens].join(" ") : undefined;
}
