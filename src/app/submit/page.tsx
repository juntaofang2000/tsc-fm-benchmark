import { CheckCircle2, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { SubmissionForm } from "@/components/shared/submission-form";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";

const steps = ["Fixed-version validation", "Administrator review", "Evaluation server download", "Official benchmark execution", "Result verification and publication"];

export const metadata = { title: "Submit a Model" };

export default function SubmitPage() {
  if (siteConfig.isStaticMirror) {
    return <><PageHeader eyebrow="Static mirror" title="Submit a Model" description="Model submissions are handled by the interactive TSC-FM Benchmark site." /><div className="container-wide section-space"><div className="mx-auto max-w-2xl rounded-xl border border-border bg-card p-6 md:p-8"><h2 className="text-xl font-semibold">Continue to the interactive site</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">This GitHub Pages mirror is read-only and contains no submission API. Use the Vercel main site to register the exact GitHub code revision and Hugging Face checkpoint revision for review.</p><Button asChild className="mt-6"><a href={`${siteConfig.primaryUrl}/submit`} target="_blank" rel="noreferrer">Open submission form <ExternalLink className="size-4" /></a></Button><p className="mt-4 text-xs leading-5 text-muted-foreground">Leaderboard, benchmark, method, evaluation, and capability-map pages remain fully available in this mirror.</p></div></div></>;
  }

  return <><PageHeader eyebrow="Model submission" title="Submit a Model" description="Register a public, immutable GitHub code revision and Hugging Face model revision for administrator review." /><div className="container-wide section-space"><div className="grid gap-10 lg:grid-cols-[1fr_340px]"><div><h2 className="mb-5 text-xl font-semibold">Model Information</h2><SubmissionForm /></div><aside><div className="sticky top-24 rounded-xl border border-border bg-muted/20 p-5"><h2 className="font-semibold">What happens after submission?</h2><ol className="mt-5 space-y-4">{steps.map((step,index) => <li key={step} className="flex gap-3"><span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-border bg-card text-xs font-medium tabular-nums">{index+1}</span><div><p className="text-sm font-medium">{step}</p>{index === 0 && <p className="mt-1 text-xs leading-5 text-muted-foreground">Repository hosts, full commit hashes, license, and protocol compatibility are checked before review.</p>}</div></li>)}</ol><div className="mt-6 flex gap-2 rounded-lg border border-primary/20 bg-primary/[0.04] p-3 text-xs leading-5 text-muted-foreground"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />The site stores metadata only. No model files are copied or executed during submission.</div></div></aside></div></div></>;
}
