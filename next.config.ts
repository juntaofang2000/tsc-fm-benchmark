import type { NextConfig } from "next";

const isGitHubPages = process.env.BUILD_TARGET === "github-pages";
const repositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "";
const isUserOrOrganizationSite = repositoryName.endsWith(".github.io");
const basePath =
  isGitHubPages && repositoryName && !isUserOrOrganizationSite
    ? `/${repositoryName}`
    : "";

const nextConfig: NextConfig = {
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
