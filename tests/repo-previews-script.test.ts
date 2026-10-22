import { describe, expect, test } from "vitest";
import { snapshotRepos } from "../scripts/repo-previews.mts";

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const IMAGE = "https://opengraph.githubassets.com/abc123/example/tool";
const TOOL = { href: "https://github.com/example/tool", slugs: ["tool"] };

function repoPage(meta: string) {
  return `<!DOCTYPE html><html><head>${meta}<title>example/tool</title></head><body></body></html>`;
}

const PAGE = repoPage(
  `<meta content="${IMAGE}" property="og:image" /><meta property="og:url" content="https://github.com/example/tool" />`,
);

function fakeFetch(routes: Record<string, () => Response>) {
  const requested: string[] = [];
  const fetchFn = (async (input: string | URL | Request) => {
    const url = String(input);
    requested.push(url);
    const route = routes[url];
    if (!route) throw new TypeError(`fetch failed for ${url}`);
    return route();
  }) as typeof fetch;
  return { fetchFn, requested };
}

describe("snapshotRepos", () => {
  test("reads the repo page's og:image and og:url, then takes that image", async () => {
    const { fetchFn, requested } = fakeFetch({
      [TOOL.href]: () => new Response(PAGE),
      [IMAGE]: () => new Response(PNG),
    });
    expect(await snapshotRepos([TOOL], fetchFn)).toEqual([
      {
        href: TOOL.href,
        canonical: "https://github.com/example/tool",
        image: PNG,
      },
    ]);
    expect(requested).toEqual([TOOL.href, IMAGE]);
  });

  test("reads tags whatever their attribute order, quoting and entities", async () => {
    const image = "https://repository-images.githubusercontent.com/1/a?b=1&c=2";
    const { fetchFn } = fakeFetch({
      [TOOL.href]: () =>
        new Response(
          repoPage(
            `<meta\n  property='og:url'\n  content='https://github.com/Example/Tool'>\n<meta property="og:image" content="https://repository-images.githubusercontent.com/1/a?b=1&amp;c=2">`,
          ),
        ),
      [image]: () => new Response(PNG),
    });
    const [snapshot] = await snapshotRepos([TOOL], fetchFn);
    expect(snapshot.canonical).toBe("https://github.com/Example/Tool");
  });

  test("a 429 names the Project, the host and how long to wait", async () => {
    const { fetchFn } = fakeFetch({
      [TOOL.href]: () => new Response(PAGE),
      [IMAGE]: () =>
        new Response("Too many requests", {
          status: 429,
          headers: { "Retry-After": "900" },
        }),
    });
    await expect(snapshotRepos([TOOL], fetchFn)).rejects.toThrow(
      /tool \(https:\/\/github\.com\/example\/tool\): opengraph\.githubassets\.com answered 429.*15 minutes.*Nothing was written/,
    );
  });

  test("reads Retry-After as an HTTP date too", async () => {
    const at = new Date(Date.now() + 90_000).toUTCString();
    const { fetchFn } = fakeFetch({
      [TOOL.href]: () =>
        new Response("", { status: 429, headers: { "Retry-After": at } }),
    });
    await expect(snapshotRepos([TOOL], fetchFn)).rejects.toThrow(
      /github\.com answered 429.*(1|2) minutes?/,
    );
  });

  test("a network failure names the Project and the host", async () => {
    const { fetchFn } = fakeFetch({});
    await expect(snapshotRepos([TOOL], fetchFn)).rejects.toThrow(
      /tool .*couldn't reach github\.com.*Nothing was written/,
    );
  });

  test("any other failed response names the status", async () => {
    const { fetchFn } = fakeFetch({
      [TOOL.href]: () => new Response("Not Found", { status: 404 }),
    });
    await expect(snapshotRepos([TOOL], fetchFn)).rejects.toThrow(
      /github\.com answered 404/,
    );
  });

  test("a page without og:image or og:url fails before fetching anything else", async () => {
    const { fetchFn, requested } = fakeFetch({
      [TOOL.href]: () => new Response(repoPage("")),
    });
    await expect(snapshotRepos([TOOL], fetchFn)).rejects.toThrow(
      /no og:image or og:url/,
    );
    expect(requested).toEqual([TOOL.href]);
  });

  test("refuses an og:image on a host GitHub doesn't serve previews from", async () => {
    const { fetchFn, requested } = fakeFetch({
      [TOOL.href]: () =>
        new Response(
          repoPage(
            `<meta property="og:image" content="https://example.com/x.png"><meta property="og:url" content="https://github.com/example/tool">`,
          ),
        ),
    });
    await expect(snapshotRepos([TOOL], fetchFn)).rejects.toThrow(
      /example\.com/,
    );
    expect(requested).toEqual([TOOL.href]);
  });
});
