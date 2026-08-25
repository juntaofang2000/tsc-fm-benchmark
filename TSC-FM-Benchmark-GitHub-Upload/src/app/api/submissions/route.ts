import { createSubmission } from "@/lib/supabase/submissions";
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
    const submission = await createSubmission(validation.data);
    return Response.json(
      {
        reference: submission.reference_code,
        status: submission.status,
        message: "Submission received and queued for administrator review.",
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "SUBMISSION_BACKEND_NOT_CONFIGURED") {
      return Response.json(
        { error: "The submission database has not been connected yet. Please contact the benchmark maintainer." },
        { status: 503 },
      );
    }
    return Response.json({ error: "The submission could not be saved. Please try again later." }, { status: 502 });
  }
}
