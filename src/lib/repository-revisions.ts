import "server-only";
import type { ValidSubmission, ValidSubmissionDraft } from "@/lib/submissions";

const COMMIT_SHA = /^[0-9a-f]{40}$/i;

export class RevisionResolutionError extends Error {
  constructor(readonly publicMessage: string, readonly diagnosticCode: string) {
    super("REVISION_RESOLUTION_FAILED");
    this.name = "RevisionResolutionError";
  }
}

function repositoryParts(repositoryUrl: string) {
  const url = new URL(repositoryUrl);
  const [owner, repository] = url.pathname.split("/").filter(Boolean);
  return { owner, repository };
}

async function resolveGithubMain(repositoryUrl: string) {
  const { owner, repository } = repositoryParts(repositoryUrl);
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "TSC-FM-Benchmark-Submission",
  };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

  let response: Response;
  try {
    response = await fetch(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/commits/main`, {
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new RevisionResolutionError(
      "GitHub main could not be resolved right now. Enter the full GitHub commit SHA and submit again.",
      "GITHUB_REVISION_FETCH_FAILED",
    );
  }

  if (!response.ok) {
    throw new RevisionResolutionError(
      "GitHub main could not be resolved for this public repository. Confirm that a main branch exists, or enter the full commit SHA manually.",
      `GITHUB_REVISION_HTTP_${response.status}`,
    );
  }
  const body = await response.json() as { sha?: unknown };
  if (typeof body.sha !== "string" || !COMMIT_SHA.test(body.sha)) {
    throw new RevisionResolutionError(
      "GitHub returned an invalid revision. Enter the full GitHub commit SHA and submit again.",
      "GITHUB_REVISION_INVALID",
    );
  }
  return body.sha.toLowerCase();
}

async function resolveHuggingFaceMain(repositoryUrl: string) {
  const { owner, repository } = repositoryParts(repositoryUrl);
  let response: Response;
  try {
    response = await fetch(`https://huggingface.co/api/models/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/revision/main?expand=sha`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new RevisionResolutionError(
      "Hugging Face main could not be resolved right now. Enter the full Hugging Face revision SHA and submit again.",
      "HUGGINGFACE_REVISION_FETCH_FAILED",
    );
  }

  if (!response.ok) {
    throw new RevisionResolutionError(
      "Hugging Face main could not be resolved for this public model. Confirm that a main revision exists, or enter the full revision SHA manually.",
      `HUGGINGFACE_REVISION_HTTP_${response.status}`,
    );
  }
  const body = await response.json() as { sha?: unknown };
  if (typeof body.sha !== "string" || !COMMIT_SHA.test(body.sha)) {
    throw new RevisionResolutionError(
      "Hugging Face returned an invalid revision. Enter the full Hugging Face revision SHA and submit again.",
      "HUGGINGFACE_REVISION_INVALID",
    );
  }
  return body.sha.toLowerCase();
}

export async function resolveSubmissionRevisions(data: ValidSubmissionDraft): Promise<ValidSubmission> {
  const [githubCommit, huggingfaceRevision] = await Promise.all([
    data.githubCommit ? Promise.resolve(data.githubCommit) : resolveGithubMain(data.githubRepository),
    data.huggingfaceRevision ? Promise.resolve(data.huggingfaceRevision) : resolveHuggingFaceMain(data.huggingfaceRepository),
  ]);

  return {
    ...data,
    githubCommit,
    githubSnapshotUrl: `${data.githubRepository}/tree/${githubCommit}`,
    huggingfaceRevision,
    huggingfaceSnapshotUrl: `${data.huggingfaceRepository}/tree/${huggingfaceRevision}`,
  };
}
