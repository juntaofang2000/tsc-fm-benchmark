import type { NextConfig } from "next";
import methodAliases from "./src/config/method-aliases.json";
import identity from "./src/config/site-identity.json";

const isGitHubPages = process.env.BUILD_TARGET === "github-pages";
const repositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "";
const isUserOrOrganizationSite = repositoryName.endsWith(".github.io");
const basePath =
  isGitHubPages && repositoryName && !isUserOrOrganizationSite
    ? `/${repositoryName}`
    : "";

const primary = new URL(process.env.NEXT_PUBLIC_PRIMARY_SITE_URL || identity.primaryUrl);
const legacyHost = "tsc-fm-benchmark.vercel.app";
const legacyHostMatch = [{ type: "host" as const, value: legacyHost.replaceAll(".", "\\.") }];
const migrationRedirects = primary.hostname === legacyHost ? [] : [
  // Resolve old aliases directly to the new canonical page, without a second hop.
  ...Object.entries(methodAliases).map(([alias, canonical]) => ({
    source: `/methods/${alias}`,
    destination: `${primary.origin}/methods/${canonical}`,
    has: legacyHostMatch,
    statusCode: 301,
  })),
  {
    // Keep Google ownership checks and robots readable on the old host.
    // Leave the submission API in place so existing POST clients keep working.
    source: "/:path((?!api(?:/|$)|robots\\.txt$|google97f75c01e0f4500a\\.html$).*)",
    destination: `${primary.origin}/:path`,
    has: legacyHostMatch,
    statusCode: 301,
  },
];

const nextConfig: NextConfig = {
  ...(!isGitHubPages ? { redirects: async () => [
    ...migrationRedirects,
    ...Object.entries(methodAliases).map(([alias, canonical]) => ({ source: `/methods/${alias}`, destination: `/methods/${canonical}`, permanent: true })),
  ] } : {}),
  ...(isGitHubPages
    ? {
        output: "export" as const,
        trailingSlash: true,
        basePath,
      }
    : {}),
  env: {
    NEXT_PUBLIC_DEPLOYMENT_TARGET: isGitHubPages ? "github-pages" : "vercel",
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
