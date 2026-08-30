import "server-only";
import type { ValidSubmission } from "@/lib/submissions";

type StoredSubmission = {
  reference_code: string;
  status: "pending";
};

export class SubmissionInsertError extends Error {
  constructor(readonly upstreamStatus: number) {
    super("SUBMISSION_INSERT_FAILED");
    this.name = "SubmissionInsertError";
  }
}

function referenceCode() {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const suffix = crypto.randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase();
  return `TSCFM-${date}-${suffix}`;
}

export async function createSubmission(data: ValidSubmission): Promise<StoredSubmission> {
  const url = process.env.SUPABASE_URL;
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) throw new Error("SUBMISSION_BACKEND_NOT_CONFIGURED");

  const reference = referenceCode();
  const response = await fetch(`${url.replace(/\/$/, "")}/rest/v1/model_submissions`, {
    method: "POST",
    headers: {
      apikey: publishableKey,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      reference_code: reference,
      model_name: data.modelName,
      organization: data.organization,
      model_category: data.category,
      paper_url: data.paperUrl,
      github_repository: data.githubRepository,
      github_commit: data.githubCommit,
      github_snapshot_url: data.githubSnapshotUrl,
      huggingface_repository: data.huggingfaceRepository,
      huggingface_revision: data.huggingfaceRevision,
      huggingface_snapshot_url: data.huggingfaceSnapshotUrl,
      contact_email: data.contactEmail,
      evaluation_track: data.evaluationTrack,
      license: data.license,
      environment_requirements: data.environment,
      model_description: data.description,
      protocol_confirmed: true,
      status: "pending",
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    console.error("Supabase submission insert failed", response.status, await response.text());
    throw new SubmissionInsertError(response.status);
  }
  return { reference_code: reference, status: "pending" };
}
