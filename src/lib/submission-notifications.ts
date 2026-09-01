import "server-only";
import type { ValidSubmission } from "@/lib/submissions";

type SubmissionNotification = {
  referenceCode: string;
  submission: ValidSubmission;
};

const RESEND_EMAIL_ENDPOINT = "https://api.resend.com/emails";

function optionalValue(value: string | null) {
  return value || "Not provided";
}

function emailBody({ referenceCode, submission }: SubmissionNotification) {
  return [
    "A new TSC-FM Benchmark submission is ready for review.",
    "",
    `Reference: ${referenceCode}`,
    "Status: pending",
    `Model: ${submission.modelName}`,
    `Organization: ${submission.organization}`,
    `Category: ${submission.category}`,
    `Evaluation track: ${submission.evaluationTrack}`,
    `Contact email: ${submission.contactEmail}`,
    `Paper: ${optionalValue(submission.paperUrl)}`,
    `License: ${optionalValue(submission.license)}`,
    "",
    `GitHub repository: ${submission.githubRepository}`,
    `GitHub commit: ${submission.githubCommit}`,
    `GitHub snapshot: ${submission.githubSnapshotUrl}`,
    "",
    `Hugging Face repository: ${submission.huggingfaceRepository}`,
    `Hugging Face revision: ${submission.huggingfaceRevision}`,
    `Hugging Face snapshot: ${submission.huggingfaceSnapshotUrl}`,
    "",
    "Environment requirements:",
    optionalValue(submission.environment),
    "",
    "Model description:",
    optionalValue(submission.description),
    "",
    "Review this record in Supabase: Table Editor → model_submissions.",
  ].join("\n");
}

export async function sendSubmissionNotification(notification: SubmissionNotification) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const recipient = process.env.SUBMISSION_NOTIFICATION_EMAIL?.trim();
  const sender = process.env.RESEND_FROM_EMAIL?.trim();

  if (!apiKey || !recipient || !sender) {
    console.error("Submission notification skipped", "RESEND_CONFIGURATION_MISSING");
    return;
  }

  const modelName = notification.submission.modelName.replace(/[\r\n]+/g, " ").trim();

  try {
    const response = await fetch(RESEND_EMAIL_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: sender,
        to: [recipient],
        subject: `[TSC-FM Submission] ${notification.referenceCode} · ${modelName}`,
        text: emailBody(notification),
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      console.error("Submission notification failed", `RESEND_HTTP_${response.status}`);
    }
  } catch (error) {
    const diagnosticCode = error instanceof Error && error.name === "TimeoutError"
      ? "RESEND_TIMEOUT"
      : "RESEND_FETCH_FAILED";
    console.error("Submission notification failed", diagnosticCode);
  }
}
