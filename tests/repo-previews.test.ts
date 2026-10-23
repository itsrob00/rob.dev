import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import prettier from "prettier";
import { afterEach, describe, expect, test, vi } from "vitest";
import { getProjects } from "../lib/projects";
import {
  getRepoPreview,
  repoTargets,
  saveRepoPreviews,
} from "../lib/repo-previews";

const PNG = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
]);

const JPG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);

const roots: string[] = [];

function readTree(root: string) {
  const tree: Record<string, Buffer> = {};
  for (const entry of fs.readdirSync(root, {
    recursive: true,
    withFileTypes: true,
  })) {
    if (!entry.isFile()) continue;
    const file = path.join(entry.parentPath, entry.name);
    tree[path.relative(root, file).replaceAll("\\", "/")] =
      fs.readFileSync(file);
  }
  return tree;
}

function useRoot(files: Record<string, string | Buffer>) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "repo-previews-"));
  roots.push(root);
  for (const [file, content] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    fs.writeFileSync(path.join(root, file), content);
  }
  vi.spyOn(process, "cwd").mockReturnValue(root);
  return root;
}

function manifest(entries: Record<string, { name: string; image: string }>) {
  return `${JSON.stringify(entries, null, 2)}\n`;
}

const TOOL = {
  "content/repo-previews.json": manifest({
    "https://github.com/example/tool": {
      name: "example/tool",
      image: "/repo-previews/example/tool.png",
    },
  }),
  "public/repo-previews/example/tool.png": PNG,
};

function project(repo?: string, live?: string) {
  return { slug: "tool", links: { repo, live } };
}

afterEach(() => {
  vi.restoreAllMocks();
  for (const root of roots.splice(0)) {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

describe("getRepoPreview", () => {
  test("returns the repo link, GitHub's name for it and the image this site serves", () => {
    useRoot(TOOL);
    expect(getRepoPreview(project("https://github.com/example/tool"))).toEqual({
      href: "https://github.com/example/tool",
      name: "example/tool",
      image: "/repo-previews/example/tool.png",
    });
  });

  test("returns undefined for a Project with only a live site", () => {
    useRoot({});
    expect(
      getRepoPreview(project(undefined, "https://tool.example.com")),
    ).toBeUndefined();
  });

  test("returns undefined for a Project that isn't public yet", () => {
    useRoot({});
    expect(getRepoPreview({ slug: "tool", links: {} })).toBeUndefined();
  });

  test("fails for a repo link with no snapshot, naming the Project, the link and the command to run", () => {
    useRoot(TOOL);
    expect(() =>
      getRepoPreview(project("https://github.com/example/other")),
    ).toThrow(
      /tool: .*https:\/\/github\.com\/example\/other.*npm run repo-previews/,
    );
  });

  test("matches the link exactly, so a trailing slash needs its own snapshot", () => {
    useRoot(TOOL);
    expect(() =>
      getRepoPreview(project("https://github.com/example/tool/")),
    ).toThrow(/npm run repo-previews/);
  });

  test("fails with the same fix when no snapshot has been taken yet", () => {
    useRoot({});
    expect(() =>
      getRepoPreview(project("https://github.com/example/tool")),
    ).toThrow(/tool: .*npm run repo-previews/);
  });

  test("fails when the snapshot's image is missing, naming the file", () => {
    useRoot({
      "content/repo-previews.json": TOOL["content/repo-previews.json"],
    });
    expect(() =>
      getRepoPreview(project("https://github.com/example/tool")),
    ).toThrow(
      /public\/repo-previews\/example\/tool\.png.*npm run repo-previews/,
    );
  });

  test("rejects a snapshot whose image isn't served by this site, naming the manifest", () => {
    useRoot({
      "content/repo-previews.json": manifest({
        "https://github.com/example/tool": {
          name: "example/tool",
          image: "https://opengraph.githubassets.com/x/example/tool",
        },
      }),
    });
    expect(() =>
      getRepoPreview(project("https://github.com/example/tool")),
    ).toThrow(/content\/repo-previews\.json[\s\S]*npm run repo-previews/);
  });

  test("rejects a manifest that isn't JSON, naming it and the fix", () => {
    useRoot({ "content/repo-previews.json": "{ not json" });
    expect(() =>
      getRepoPreview(project("https://github.com/example/tool")),
    ).toThrow(/content\/repo-previews\.json[\s\S]*npm run repo-previews/);
  });

  test("fails for a repo that isn't on GitHub, naming the Project", () => {
    useRoot(TOOL);
    expect(() =>
      getRepoPreview(project("https://gitlab.com/example/tool")),
    ).toThrow(/tool: https:\/\/gitlab\.com\/example\/tool isn't a GitHub repo/);
  });
});

test("every Project in the site's content has its Repo preview", () => {
  for (const site of getProjects()) {
    expect(() => getRepoPreview(site)).not.toThrow();
  }
});

describe("repoTargets", () => {
  test("lists each repo once, in a stable order, with every Project that links it", () => {
    expect(
      repoTargets([
        { slug: "zeta", links: { repo: "https://github.com/example/zeta" } },
        { slug: "site", links: { live: "https://example.com" } },
        { slug: "alpha", links: { repo: "https://github.com/example/Tool" } },
        { slug: "beta", links: { repo: "https://github.com/example/Tool" } },
      ]),
    ).toEqual([
      { href: "https://github.com/example/Tool", slugs: ["alpha", "beta"] },
      { href: "https://github.com/example/zeta", slugs: ["zeta"] },
    ]);
  });

  test("refuses a repo that isn't on GitHub, naming the Project", () => {
    expect(() =>
      repoTargets([
        { slug: "tool", links: { repo: "https://github.com/example/tool" } },
        { slug: "other", links: { repo: "https://github.com/example" } },
      ]),
    ).toThrow(/other: https:\/\/github\.com\/example isn't a GitHub repo/);
  });
});

describe("saveRepoPreviews", () => {
  const snapshot = {
    href: "https://github.com/Example/Tool",
    canonical: "https://github.com/example/tool",
    image: PNG,
  };

  test("what it saves, getRepoPreview reads back, with GitHub's spelling of the name", () => {
    useRoot({});
    saveRepoPreviews([snapshot]);
    expect(getRepoPreview(project(snapshot.href))).toEqual({
      href: "https://github.com/Example/Tool",
      name: "example/tool",
      image: "/repo-previews/example/tool.png",
    });
  });

  test("saving the same snapshots again leaves every file as it was, already formatted the way Prettier would", async () => {
    const root = useRoot({});
    expect(saveRepoPreviews([snapshot]).written).toEqual([
      "public/repo-previews/example/tool.png",
      "content/repo-previews.json",
    ]);
    const first = readTree(root);
    expect(saveRepoPreviews([snapshot])).toEqual({ written: [], removed: [] });
    expect(readTree(root)).toEqual(first);
    const text = first["content/repo-previews.json"].toString();
    expect(await prettier.format(text, { parser: "json" })).toBe(text);
  });

  test("drops a repo no snapshot lists any more, with its image, and reports it", () => {
    const root = useRoot(TOOL);
    const report = saveRepoPreviews([snapshot]);
    expect(Object.keys(readTree(root)).sort()).toEqual([
      "content/repo-previews.json",
      "public/repo-previews/example/tool.png",
    ]);
    expect(report.removed).toEqual([]);

    const later = saveRepoPreviews([
      {
        ...snapshot,
        href: "https://github.com/example/next",
        canonical: "https://github.com/example/next",
      },
    ]);
    expect(Object.keys(readTree(root)).sort()).toEqual([
      "content/repo-previews.json",
      "public/repo-previews/example/next.png",
    ]);
    expect(later.removed).toEqual(["public/repo-previews/example/tool.png"]);
  });

  test("replaces the image when GitHub's changes format", () => {
    const root = useRoot({});
    saveRepoPreviews([snapshot]);
    saveRepoPreviews([{ ...snapshot, image: JPG }]);
    expect(Object.keys(readTree(root)).sort()).toEqual([
      "content/repo-previews.json",
      "public/repo-previews/example/tool.jpg",
    ]);
  });

  test("leaves files it didn't make alone, and clears leftovers from an interrupted run", () => {
    const root = useRoot({
      "public/repo-previews/README.txt": "notes",
      "public/repo-previews/example/tool.png.tmp": "half",
    });
    saveRepoPreviews([snapshot]);
    expect(Object.keys(readTree(root)).sort()).toEqual([
      "content/repo-previews.json",
      "public/repo-previews/README.txt",
      "public/repo-previews/example/tool.png",
    ]);
  });

  test("writes nothing when GitHub now serves the repo under another name, telling Rob to update the link", () => {
    const root = useRoot({});
    expect(() =>
      saveRepoPreviews([
        snapshot,
        {
          href: "https://github.com/example/old",
          canonical: "https://github.com/example/new",
          image: PNG,
        },
      ]),
    ).toThrow(
      /https:\/\/github\.com\/example\/old.*https:\/\/github\.com\/example\/new.*links\.repo[\s\S]*Nothing was written/,
    );
    expect(readTree(root)).toEqual({});
  });

  test("writes nothing when an image isn't a PNG, JPEG or GIF, or is too big", () => {
    const root = useRoot({});
    expect(() =>
      saveRepoPreviews([
        snapshot,
        {
          href: "https://github.com/example/page",
          canonical: "https://github.com/example/page",
          image: Buffer.from("<html>"),
        },
        {
          href: "https://github.com/example/huge",
          canonical: "https://github.com/example/huge",
          image: Buffer.concat([PNG, Buffer.alloc(3_000_000)]),
        },
      ]),
    ).toThrow(
      /example\/page.*isn't a PNG, JPEG or GIF[\s\S]*example\/huge.*over 2 MB[\s\S]*Nothing was written/,
    );
    expect(readTree(root)).toEqual({});
  });
});
