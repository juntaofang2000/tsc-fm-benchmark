import Link from "next/link";
import { siteConfig } from "@/config/site";
import { benchmarkPublication } from "@/config/benchmark-publication";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-muted/20">
      <div className="container-wide grid gap-5 py-6 md:grid-cols-[1fr_auto] md:py-7">
        <div>
          <p className="font-semibold">{siteConfig.name}</p>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">{siteConfig.subtitle}</p>
          <p className="mt-3 text-xs text-muted-foreground">Jointly released by {siteConfig.publishers.map((publisher, index) => <span key={publisher.name}>{index > 0 && " and "}{"url" in publisher ? <a href={publisher.url} target="_blank" rel="noreferrer" className="font-medium text-foreground hover:text-primary">{publisher.name}</a> : <span className="font-medium text-foreground">{publisher.name}</span>}</span>)}.</p>
          <p className="mt-3 text-xs text-muted-foreground">Maintained by <a href={siteConfig.maintainer.url} target="_blank" rel="noreferrer" className="font-medium text-foreground hover:text-primary">{siteConfig.maintainer.name}</a> · <a href={`mailto:${siteConfig.maintainer.email}`} className="hover:text-foreground">{siteConfig.maintainer.email}</a></p>
        </div>
        <div className="flex flex-wrap content-start gap-x-6 gap-y-3 text-sm text-muted-foreground">
          <Link href="/leaderboard" className="hover:text-foreground">Leaderboard</Link>
          <Link href="/benchmarks" className="hover:text-foreground">Dataset Profile</Link>
          <Link href="/capability-map" className="hover:text-foreground">Capability Map</Link>
          <Link href="/evaluation" className="hover:text-foreground">Evaluation</Link>
          <Link href="/methods" className="hover:text-foreground">Methods</Link>
          <Link href="/submit" className="hover:text-foreground">Submit a Model</Link>
          <a href={siteConfig.links.huggingFace} target="_blank" rel="noreferrer" className="hover:text-foreground">Hugging Face</a>
          <a href={benchmarkPublication.url} target="_blank" rel="noreferrer" className="hover:text-foreground">Benchmark Paper</a>
        </div>
      </div>
    </footer>
  );
}
