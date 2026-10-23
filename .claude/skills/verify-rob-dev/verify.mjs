#!/usr/bin/env node

import { execSync, spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";

const ROOT = execSync("git rev-parse --show-toplevel").toString().trim();
const DIR = path.join(ROOT, ".verify");
const STATE = path.join(DIR, "state.json");
const KNOWN_PREFETCH_404 = /\/__next\.[^/]+\.__PAGE__\.txt/;

const [command, ...rest] = process.argv.slice(2);
const positional = [];
const flags = {};
for (let i = 0; i < rest.length; i++) {
  const arg = rest[i];
  if (!arg.startsWith("--")) positional.push(arg);
  else if (rest[i + 1] === undefined || rest[i + 1].startsWith("--"))
    flags[arg.slice(2)] = true;
  else flags[arg.slice(2)] = rest[++i];
}

const head = () =>
  execSync("git rev-parse --short HEAD", { cwd: ROOT }).toString().trim();
const readState = () =>
  fs.existsSync(STATE) ? JSON.parse(fs.readFileSync(STATE, "utf8")) : null;
const alive = (pid) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
};
const answers = async (url) => {
  try {
    const response = await fetch(url);
    return response.ok ? await response.text() : null;
  } catch {
    return null;
  }
};
const fail = (message) => {
  console.error(`FAIL ${message}`);
  process.exit(1);
};

async function launch() {
  const port = Number(flags.port ?? 3500);
  const existing = readState();
  if (existing && alive(existing.pid))
    fail(
      `an instance from this checkout is already up at ${existing.url} (pid ${existing.pid}); run stop first`,
    );
  if (await answers(`http://localhost:${port}`))
    fail(
      `port ${port} already answers and isn't ours; pick another with --port`,
    );
  if (!flags["no-build"])
    execSync("npm run build", { cwd: ROOT, stdio: "inherit" });
  if (!fs.existsSync(path.join(ROOT, "out", "index.html")))
    fail("out/index.html missing: build first");

  fs.mkdirSync(DIR, { recursive: true });
  const log = fs.openSync(path.join(DIR, "serve.log"), "w");
  const serve = path.join(ROOT, "node_modules", "serve", "build", "main.js");
  const child = spawn(
    process.execPath,
    [serve, "out", "-l", String(port), "-L", "-n"],
    {
      cwd: ROOT,
      detached: true,
      stdio: ["ignore", log, log],
      windowsHide: true,
    },
  );
  child.unref();

  const url = `http://localhost:${port}`;
  for (let tries = 0; tries < 50 && !(await answers(url)); tries++)
    await new Promise((resolve) => setTimeout(resolve, 200));
  if (!(await answers(url)))
    fail(`serve did not answer at ${url}; see .verify/serve.log`);

  const state = {
    pid: child.pid,
    port,
    url,
    head: head(),
    builtAt: fs.statSync(path.join(ROOT, "out", "index.html")).mtimeMs,
  };
  fs.writeFileSync(STATE, JSON.stringify(state, null, 2));
  console.log(`READY ${url} pid=${child.pid} head=${state.head}`);
}

async function doctor() {
  const state = readState();
  if (!state) fail("no instance: run launch");
  const problems = [];
  if (!alive(state.pid)) problems.push(`pid ${state.pid} is gone`);
  const html = await answers(state.url);
  if (!html) problems.push(`${state.url} does not answer`);
  else if (!/<h1[^>]*>Rob<\/h1>/.test(html))
    problems.push(`${state.url} answers but isn't rob.dev's home page`);
  if (state.head !== head())
    problems.push(`built at ${state.head}, checkout is at ${head()}: relaunch`);
  const dirty = execSync("git status --porcelain", { cwd: ROOT })
    .toString()
    .split("\n")
    .map((line) => line.slice(3).trim())
    .filter(
      (file) =>
        file &&
        !file.startsWith(".verify") &&
        fs.existsSync(path.join(ROOT, file)),
    )
    .filter(
      (file) => fs.statSync(path.join(ROOT, file)).mtimeMs > state.builtAt,
    );
  if (dirty.length)
    problems.push(`edited since the build: ${dirty.join(", ")}: relaunch`);
  if (problems.length) fail(problems.join("; "));
  console.log(`OK ${state.url} pid=${state.pid} head=${state.head}`);
}

async function shot() {
  const state = readState();
  if (!state || !alive(state.pid)) fail("no live instance: run launch");
  const raw = positional[0] ?? "";
  if (/^[A-Za-z]:[\\/]/.test(raw))
    fail(
      `route "${raw}" looks rewritten by Git Bash: pass it without the leading slash (resume, projects/devflow) or omit it for home`,
    );
  const route = "/" + raw.replace(/^\/+/, "");
  const name = flags.name ?? "shot";
  const theme = flags.theme ?? "dark";
  const width = Number(flags.width ?? 1280);
  const height = Number(flags.height ?? 900);
  const out = path.join(DIR, "evidence", flags.run ?? "adhoc");
  fs.mkdirSync(out, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width, height },
    reducedMotion: flags.motion ? "no-preference" : "reduce",
  });
  await context.addInitScript((value) => {
    if (value === "light") localStorage.setItem("theme", "light");
  }, theme);
  await context.route("**/_vercel/**/script.js", (route) =>
    route.fulfill({ contentType: "text/javascript", body: "" }),
  );
  const page = await context.newPage();
  const errors = [];
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      !KNOWN_PREFETCH_404.test(message.location().url)
    )
      errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto(state.url + route, { waitUntil: "networkidle" });
  const target = flags.section
    ? page.locator(`#${flags.section}`)
    : page.locator("body");
  await target.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  const png = path.join(out, `${name}.png`);
  if (flags.section) {
    const box = await target.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return {
        x: rect.x + scrollX,
        y: rect.y + scrollY,
        width: rect.width,
        height: rect.height,
      };
    });
    await page.screenshot({ path: png, fullPage: true, clip: box });
  } else await page.screenshot({ path: png, fullPage: Boolean(flags.full) });
  const aria = await target.ariaSnapshot();
  fs.writeFileSync(path.join(out, `${name}.aria.txt`), aria + "\n");
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  const htmlTheme = await page.evaluate(
    () => document.documentElement.dataset.theme,
  );
  const record = {
    route,
    section: flags.section ?? null,
    theme: htmlTheme,
    width,
    height,
    horizontalOverflowPx: overflow,
    consoleErrors: errors,
    head: state.head,
    at: new Date().toISOString(),
  };
  fs.writeFileSync(
    path.join(out, `${name}.json`),
    JSON.stringify(record, null, 2) + "\n",
  );
  await browser.close();

  console.log(`SHOT ${png}`);
  console.log(JSON.stringify(record));
  if (htmlTheme !== theme)
    fail(`asked for ${theme}, page rendered ${htmlTheme}`);
  if (overflow > 0)
    fail(`page scrolls sideways by ${overflow}px at width ${width}`);
  if (errors.length) fail(`console errors: ${errors.join(" | ")}`);
}

function stop() {
  const state = readState();
  if (!state) return console.log("nothing to stop");
  if (alive(state.pid)) process.kill(state.pid);
  fs.rmSync(STATE);
  console.log(
    `STOPPED pid=${state.pid}; evidence kept in ${path.join(DIR, "evidence")}`,
  );
}

const commands = { launch, doctor, shot, stop };
if (!commands[command])
  fail(`usage: verify.mjs <${Object.keys(commands).join("|")}> [options]`);
await commands[command]();
