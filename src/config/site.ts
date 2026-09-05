import identity from "./site-identity.json";

const primary = new URL(process.env.NEXT_PUBLIC_PRIMARY_SITE_URL || identity.primaryUrl);
if (primary.protocol !== "https:" || primary.pathname !== "/" || primary.search || primary.hash || primary.username || primary.password) {
  throw new Error("The primary SEO URL must be an HTTPS origin, without a path, query or credentials.");
}

export const siteConfig = {
  ...identity,
  url: primary.origin,
  primaryUrl: primary.origin,
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
  isStaticMirror:
    process.env.NEXT_PUBLIC_DEPLOYMENT_TARGET === "github-pages",
  links: {
    huggingFace: "https://huggingface.co/TSC-FM",
  },
  maintainer: {
    name: "Juntao Fang",
    url: "https://juntaofang2000.github.io/",
    email: "fangjuntao1@mails.gdut.edu.cn",
  },
  nav: [
    { label: "Home", href: "/" },
    { label: "Leaderboard", href: "/leaderboard" },
    { label: "Dataset Profile", href: "/benchmarks" },
    { label: "Capability Map", href: "/capability-map" },
    { label: "Methods", href: "/methods" },
    { label: "Evaluation", href: "/evaluation" },
    { label: "Submit", href: "/submit" },
  ],
} as const;
