import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, existsSync, renameSync } from "node:fs";
import { resolve, join } from "node:path";

const identity = JSON.parse(readFileSync("src/config/site-identity.json", "utf8"));
const aliases = JSON.parse(readFileSync("src/config/method-aliases.json", "utf8"));
const primaryUrl = process.env.NEXT_PUBLIC_PRIMARY_SITE_URL || identity.primaryUrl;
const output = resolve("out");
// Archive an old export so an unsuccessful/non-export build can never publish stale files.
if (existsSync(output)) {
  mkdirSync("artifacts/seo", { recursive: true });
  renameSync(output, resolve(`artifacts/seo/previous-export-${Date.now()}`));
}

const fallbackRepository = "juntaofang2000/tsc-fm-benchmark-public";
const repository = process.env.GITHUB_REPOSITORY || fallbackRepository;
const [owner, repositoryName] = repository.split("/");
const isUserOrOrganizationSite = repositoryName?.endsWith(".github.io");
const pagesUrl = isUserOrOrganizationSite
  ? `https://${repositoryName}`
  : `https://${owner}.github.io/${repositoryName}`;

const publicDataResult = spawnSync(
  process.execPath,
  ["scripts/build-public-leaderboards.mjs"],
  { stdio: "inherit", env: process.env },
);

if (publicDataResult.status !== 0) process.exit(publicDataResult.status ?? 1);

const publicCapabilityResult = spawnSync(
  process.execPath,
  ["scripts/build-public-capability.mjs"],
  { stdio: "inherit", env: process.env },
);

if (publicCapabilityResult.status !== 0) process.exit(publicCapabilityResult.status ?? 1);

const manifestResult = spawnSync(process.execPath, ["scripts/write-release-manifest.mjs"], { stdio: "inherit", env: process.env });
if (manifestResult.status !== 0) process.exit(manifestResult.status ?? 1);

const result = spawnSync(
  process.execPath,
  ["node_modules/next/dist/bin/next", "build"],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      BUILD_TARGET: "github-pages",
      GITHUB_REPOSITORY: repository,
      NEXT_PUBLIC_SITE_URL: pagesUrl,
      NEXT_PUBLIC_PRIMARY_SITE_URL: primaryUrl,
    },
  },
);

if (result.status !== 0) process.exit(result.status ?? 1);
if (!existsSync(join(output, "index.html"))) throw new Error("Static export did not produce a fresh out/index.html; refusing to publish.");
const capabilityHtml = readFileSync(join(output, "capability-map/index.html"), "utf8");
if (!capabilityHtml.includes("Fixed Overall capability core") || !capabilityHtml.includes(primaryUrl)) throw new Error("Static capability export is not the current canonical fixed-core version.");
for (const [alias, canonical] of Object.entries(aliases)) {
  const url = new URL(`/methods/${canonical}`, primaryUrl).toString();
  const directory = join(output, "methods", alias);
  mkdirSync(directory, { recursive: true });
  // GitHub Pages cannot serve HTTP 308; use a zero-delay redirect document.
  writeFileSync(join(directory, "index.html"), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Method page moved | TSC-FM Benchmark</title><link rel="canonical" href="${url}"><meta http-equiv="refresh" content="0;url=${url}"></head><body><p>This configuration is documented on the shared model page: <a href="${url}">${canonical}</a>.</p></body></html>`);
}
writeFileSync(join(output, ".nojekyll"), "");
console.log(`Verified fresh static export for ${pagesUrl}; ${Object.keys(aliases).length} legacy method redirects generated.`);
