import {
  createSubmission,
  SubmissionConnectionError,
  SubmissionInsertError,
} from "@/lib/supabase/submissions";
import { resolveSubmissionRevisions, RevisionResolutionError } from "@/lib/repository-revisions";
import { validateSubmission } from "@/lib/submissions";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const validation = validateSubmission(payload);
  if (!validation.ok) return Response.json({ error: validation.error }, { status: 400 });

  try {
    const resolved = await resolveSubmissionRevisions(validation.data);
    const submission = await createSubmission(resolved);
    return Response.json(
      {
        reference: submission.reference_code,
        status: submission.status,
        githubCommit: resolved.githubCommit,
        huggingfaceRevision: resolved.huggingfaceRevision,
        message: "Submission received and queued for administrator review.",
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof RevisionResolutionError) {
      return Response.json(
        { error: error.publicMessage, diagnosticCode: error.diagnosticCode },
        { status: 422 },
      );
    }
    if (error instanceof Error && error.message === "SUBMISSION_BACKEND_NOT_CONFIGURED") {
      return Response.json(
        { error: "The submission database has not been connected yet. Please contact the benchmark maintainer." },
        { status: 503 },
      );
    }
    if (error instanceof SubmissionInsertError) {
      return Response.json(
        {
          error: "The submission could not be saved. Please try again later.",
          diagnosticCode: `SUPABASE_HTTP_${error.upstreamStatus}`,
        },
        { status: 502 },
      );
    }
    if (error instanceof SubmissionConnectionError) {
      return Response.json(
        {
          error: "The submission could not be saved. Please try again later.",
          diagnosticCode: error.diagnosticCode,
        },
        { status: 502 },
      );
    }
    return Response.json({ error: "The submission could not be saved. Please try again later." }, { status: 502 });
  }
}
