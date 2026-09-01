"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2, LoaderCircle, LockKeyhole } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EVALUATION_TRACKS, MODEL_CATEGORIES, type SubmissionPayload } from "@/lib/submissions";

type SubmissionResult = {
  reference: string;
  status: "pending";
  githubCommit: string;
  huggingfaceRevision: string;
  message: string;
};

const fieldClass = "grid gap-2 text-sm font-medium";
const helpClass = "text-xs font-normal leading-5 text-muted-foreground";

export function SubmissionForm() {
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SubmissionResult | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const payload: SubmissionPayload = {
      model: String(values.get("model") ?? ""),
      organization: String(values.get("organization") ?? ""),
      category: String(values.get("category") ?? ""),
      paper: String(values.get("paper") ?? ""),
      github: String(values.get("github") ?? ""),
      githubCommit: String(values.get("githubCommit") ?? ""),
      checkpoint: String(values.get("checkpoint") ?? ""),
      checkpointRevision: String(values.get("checkpointRevision") ?? ""),
      email: String(values.get("email") ?? ""),
      track: String(values.get("track") ?? ""),
      license: String(values.get("license") ?? ""),
      environment: String(values.get("environment") ?? ""),
      description: String(values.get("description") ?? ""),
      website: String(values.get("website") ?? ""),
      confirmed,
    };

    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await response.json()) as SubmissionResult | { error?: string };
      if (!response.ok || !("reference" in body)) {
        throw new Error("error" in body && body.error ? body.error : "Submission failed.");
      }
      setResult(body);
      form.reset();
      setConfirmed(false);
      toast.success("Submission received for review.");
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Submission failed.";
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.05] p-6 md:p-8" role="status">
        <div className="flex items-start gap-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
            <CheckCircle2 className="size-5" />
          </span>
          <div>
            <p className="text-lg font-semibold">Submission received</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              The fixed GitHub and Hugging Face revisions are queued for administrator review.
            </p>
            <dl className="mt-5 grid gap-3 rounded-lg border border-emerald-500/20 bg-background/70 p-4 text-sm sm:grid-cols-2">
              <div><dt className="text-xs text-muted-foreground">Reference</dt><dd className="mt-1 font-mono font-medium">{result.reference}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Status</dt><dd className="mt-1 font-medium">Pending review</dd></div>
              <div className="sm:col-span-2"><dt className="text-xs text-muted-foreground">Locked GitHub revision</dt><dd className="mt-1 break-all font-mono text-xs font-medium">{result.githubCommit}</dd></div>
              <div className="sm:col-span-2"><dt className="text-xs text-muted-foreground">Locked Hugging Face revision</dt><dd className="mt-1 break-all font-mono text-xs font-medium">{result.huggingfaceRevision}</dd></div>
            </dl>
            <p className="mt-4 text-xs leading-5 text-muted-foreground">Keep the reference code for future correspondence. The maintainer will use the contact email supplied in the form.</p>
            <Button type="button" variant="outline" className="mt-5" onClick={() => setResult(null)}>Submit another model</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-border bg-card p-5 md:p-7">
      <div className="mb-6 flex gap-3 rounded-lg border border-primary/20 bg-primary/[0.04] p-4 text-sm leading-6 text-muted-foreground">
        <LockKeyhole className="mt-1 size-4 shrink-0 text-primary" />
        <p>No files are uploaded. Both repositories must be public. You may provide immutable commit SHAs, or leave them blank to lock the current main revisions automatically.</p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <label className={fieldClass}>Model Name *<Input name="model" required maxLength={120} autoComplete="off" /></label>
        <label className={fieldClass}>Organization *<Input name="organization" required maxLength={160} autoComplete="organization" /></label>

        <label className={fieldClass}>Model Category *
          <select name="category" className="h-9 rounded-md border border-input bg-background px-3 text-sm" required defaultValue="">
            <option value="" disabled>Select category</option>
            {MODEL_CATEGORIES.map((category) => <option key={category}>{category}</option>)}
          </select>
        </label>
        <label className={fieldClass}>Paper URL<Input name="paper" type="url" maxLength={500} placeholder="https://arxiv.org/abs/..." /></label>

        <label className={fieldClass}>GitHub Repository *
          <Input name="github" type="url" required maxLength={500} placeholder="https://github.com/owner/repository" />
          <span className={helpClass}>Repository root URL, not a branch or file URL.</span>
        </label>
        <label className={fieldClass}>GitHub Commit SHA <span className={helpClass}>Optional</span>
          <Input name="githubCommit" maxLength={40} pattern="[0-9a-fA-F]{40}" className="font-mono" placeholder="Leave blank to lock main automatically" spellCheck={false} />
          <span className={helpClass}>If supplied, use the full 40-character hash shown by GitHub.</span>
        </label>

        <label className={fieldClass}>Hugging Face Model *
          <Input name="checkpoint" type="url" required maxLength={500} placeholder="https://huggingface.co/owner/model" />
          <span className={helpClass}>Public model repository containing the checkpoint.</span>
        </label>
        <label className={fieldClass}>Hugging Face Revision <span className={helpClass}>Optional</span>
          <Input name="checkpointRevision" maxLength={40} pattern="[0-9a-fA-F]{40}" className="font-mono" placeholder="Leave blank to lock main automatically" spellCheck={false} />
          <span className={helpClass}>If left blank, the server resolves main once and stores the resulting immutable SHA.</span>
        </label>

        <label className={fieldClass}>Contact Email *<Input name="email" type="email" required maxLength={254} autoComplete="email" /></label>
        <label className={fieldClass}>Evaluation Track *
          <select name="track" className="h-9 rounded-md border border-input bg-background px-3 text-sm" required defaultValue="Standard">
            {EVALUATION_TRACKS.map((track) => <option key={track}>{track}</option>)}
          </select>
        </label>

        <label className={fieldClass}>License<Input name="license" maxLength={120} placeholder="e.g. Apache-2.0" /></label>
        <label className={fieldClass}>Environment / Requirements<Input name="environment" maxLength={1000} placeholder="e.g. Python 3.11, CUDA 12.1" /></label>
      </div>

      <label className="mt-5 grid gap-2 text-sm font-medium">Model Description
        <textarea name="description" maxLength={4000} className="min-h-28 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
      </label>

      <label className="absolute -left-[10000px] top-auto size-px overflow-hidden" aria-hidden="true">
        Website<Input name="website" tabIndex={-1} autoComplete="off" />
      </label>

      <label className="mt-5 flex items-start gap-3 text-sm text-muted-foreground">
        <input type="checkbox" className="mt-0.5 size-4 accent-[var(--primary)]" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />
        <span>I confirm that the public code and checkpoint can be executed under the official benchmark protocol and will remain available during review.</span>
      </label>

      {error && <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/[0.05] p-3 text-sm text-destructive" role="alert">{error}</p>}

      <Button type="submit" className="mt-6" disabled={!confirmed || submitting}>
        {submitting && <LoaderCircle className="size-4 animate-spin" />}
        {submitting ? "Saving submission…" : "Submit for Review"}
      </Button>
    </form>
  );
}
