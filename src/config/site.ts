export const siteConfig = {
  name: "TSC-FM Benchmark",
  shortName: "TSC-FM",
  title: "TSC-FM Benchmark",
  description:
    "A unified benchmark and leaderboard for time series classification foundation models.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  primaryUrl:
    process.env.NEXT_PUBLIC_PRIMARY_SITE_URL ||
    "https://tsc-fm-benchmark.vercel.app",
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
  isStaticMirror:
    process.env.NEXT_PUBLIC_DEPLOYMENT_TARGET === "github-pages",
  links: {
    huggingFace: "https://huggingface.co/",
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
    { label: "Methods", href: "/methods" },
    { label: "Evaluation", href: "/evaluation" },
    { label: "Submit", href: "/submit" },
  ],
} as const;
