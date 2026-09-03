import { Check, Circle, CircleDot } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";

const statuses = ["Submitted", "Validated", "Queued", "Running", "Reviewing", "Published"];

export const metadata = { title: "Demo Submission", description: "A demonstration of a planned evaluation status page. This is not a real submission or an evaluated result.", robots: { index: false, follow: true } };

export default function DemoSubmissionPage() {
  return <><PageHeader eyebrow="Demo Workflow" title="Submission CT-DEMO-001" description="A preview of the task status experience planned for future official evaluations." /><div className="container-wide section-space"><div className="mx-auto max-w-3xl rounded-xl border border-border bg-card p-5 md:p-8"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm text-muted-foreground">Model</p><h2 className="mt-1 text-xl font-semibold">ChorusTIC Preview</h2></div><Badge variant="secondary">Queued</Badge></div><div className="mt-9">{statuses.map((status,index) => { const complete=index<2; const current=index===2; return <div key={status} className="relative flex min-h-20 gap-4 last:min-h-0"><div className="relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-background">{complete ? <Check className="size-4 text-emerald-600" /> : current ? <CircleDot className="size-4 text-primary" /> : <Circle className="size-4 text-muted-foreground" />}</div>{index<statuses.length-1 && <div className="absolute left-[15px] top-8 h-[calc(100%-1rem)] w-px bg-border" />}<div className="pt-1"><p className={current ? "text-sm font-semibold text-primary" : "text-sm font-medium"}>{status}</p><p className="mt-1 text-xs text-muted-foreground">{complete ? "Completed in demo workflow" : current ? "Awaiting future GPU evaluation capacity" : "Pending previous stage"}</p></div></div>;})}</div></div></div></>;
}
