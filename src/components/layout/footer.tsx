import Link from "next/link";
import { siteConfig } from "@/config/site";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-muted/20">
      <div className="container-wide grid gap-5 py-6 md:grid-cols-[1fr_auto] md:py-7">
        <div>
          <p className="font-semibold">TSC-FM Benchmark</p>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">Time Series Classification Foundation Model Benchmark</p>
          <p className="mt-3 text-xs text-muted-foreground">Maintained by <a href={siteConfig.maintainer.url} target="_blank" rel="noreferrer" className="font-medium text-foreground hover:text-primary">{siteConfig.maintainer.name}</a> · <a href={`mailto:${siteConfig.maintainer.email}`} className="hover:text-foreground">{siteConfig.maintainer.email}</a></p>
        </div>
        <div className="flex flex-wrap content-start gap-x-6 gap-y-3 text-sm text-muted-foreground">
          <Link href="/leaderboard" className="hover:text-foreground">Leaderboard</Link>
          <Link href="/benchmarks" className="hover:text-foreground">Dataset Profile</Link>
          <Link href="/capability-map" className="hover:text-foreground">Capability Map</Link>
          <Link href="/evaluation" className="hover:text-foreground">Evaluation</Link>
          <a href={siteConfig.links.huggingFace} target="_blank" rel="noreferrer" className="hover:text-foreground">Hugging Face</a>
        </div>
      </div>
    </footer>
  );
}
