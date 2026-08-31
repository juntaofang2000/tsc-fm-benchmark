import { spawnSync } from "node:child_process";

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

const result = spawnSync(
  process.execPath,
  ["node_modules/next/dist/bin/next", "build"],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      BUILD_TARGET: "github-pages",
      GITHUB_REPOSITORY: repository,
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || pagesUrl,
      NEXT_PUBLIC_PRIMARY_SITE_URL:
        process.env.NEXT_PUBLIC_PRIMARY_SITE_URL ||
        "https://tsc-fm-benchmark.vercel.app",
    },
  },
);

process.exit(result.status ?? 1);
