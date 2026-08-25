export const MODEL_CATEGORIES = [
  "Foundation Model",
  "Representation Learning",
  "In-Context Learning",
  "Supervised",
] as const;

export const EVALUATION_TRACKS = [
  "Standard",
  "Low-shot",
  "OOD",
  "Training-Free / ICL",
  "Frozen-Probe",
] as const;

export type SubmissionPayload = {
  model: string;
  organization: string;
  category: string;
  paper?: string;
  github: string;
  githubCommit: string;
  checkpoint: string;
  checkpointRevision: string;
  email: string;
  track: string;
  license?: string;
  environment?: string;
  description?: string;
  confirmed: boolean;
  website?: string;
};

export type ValidSubmission = {
  modelName: string;
  organization: string;
  category: (typeof MODEL_CATEGORIES)[number];
  paperUrl: string | null;
  githubRepository: string;
  githubCommit: string;
  githubSnapshotUrl: string;
  huggingfaceRepository: string;
  huggingfaceRevision: string;
  huggingfaceSnapshotUrl: string;
  contactEmail: string;
  evaluationTrack: (typeof EVALUATION_TRACKS)[number];
  license: string | null;
  environment: string | null;
  description: string | null;
};

type ValidationResult =
  | { ok: true; data: ValidSubmission }
  | { ok: false; error: string };

const COMMIT_SHA = /^[0-9a-f]{40}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readText(value: unknown, label: string, maxLength: number, required = true) {
  if (typeof value !== "string") {
    return required ? { value: null, error: `${label} is required.` } : { value: null };
  }
  const normalized = value.trim();
  if (!normalized) {
    return required ? { value: null, error: `${label} is required.` } : { value: null };
  }
  if (normalized.length > maxLength) return { value: null, error: `${label} is too long.` };
  return { value: normalized };
}

function repositoryUrl(value: unknown, host: "github.com" | "huggingface.co", label: string) {
  const result = readText(value, label, 500);
  if (result.error || !result.value) return { error: result.error ?? `${label} is required.` };
  try {
    const url = new URL(result.value);
    const segments = url.pathname.split("/").filter(Boolean);
    if (url.protocol !== "https:" || url.hostname.toLowerCase() !== host || segments.length !== 2) {
      return { error: `${label} must be a public ${host} repository URL.` };
    }
    const repository = segments[1].replace(/\.git$/i, "");
    if (!segments[0] || !repository) return { error: `${label} is invalid.` };
    return { value: `https://${host}/${segments[0]}/${repository}` };
  } catch {
    return { error: `${label} must be a valid HTTPS URL.` };
  }
}

function optionalUrl(value: unknown) {
  const result = readText(value, "Paper URL", 500, false);
  if (result.error) return { error: result.error };
  if (!result.value) return { value: null };
  try {
    const url = new URL(result.value);
    if (!(["http:", "https:"] as string[]).includes(url.protocol)) {
      return { error: "Paper URL must use HTTP or HTTPS." };
    }
    return { value: url.toString() };
  } catch {
    return { error: "Paper URL must be a valid URL." };
  }
}

export function validateSubmission(input: unknown): ValidationResult {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, error: "Invalid submission payload." };
  }
  const payload = input as Partial<SubmissionPayload>;

  // Quietly reject automated form fillers without exposing the trap field.
  if (typeof payload.website === "string" && payload.website.trim()) {
    return { ok: false, error: "Submission could not be accepted." };
  }

  const modelName = readText(payload.model, "Model name", 120);
  const organization = readText(payload.organization, "Organization", 160);
  const category = readText(payload.category, "Model category", 80);
  const github = repositoryUrl(payload.github, "github.com", "GitHub repository");
  const huggingface = repositoryUrl(payload.checkpoint, "huggingface.co", "Hugging Face repository");
  const paper = optionalUrl(payload.paper);
  const email = readText(payload.email, "Contact email", 254);
  const track = readText(payload.track, "Evaluation track", 80);
  const license = readText(payload.license, "License", 120, false);
  const environment = readText(payload.environment, "Environment", 1000, false);
  const description = readText(payload.description, "Description", 4000, false);

  for (const candidate of [modelName, organization, category, email, track, license, environment, description]) {
    if (candidate.error) return { ok: false, error: candidate.error };
  }
  if (github.error) return { ok: false, error: github.error };
  if (huggingface.error) return { ok: false, error: huggingface.error };
  if (paper.error) return { ok: false, error: paper.error };
  if (!category.value || !MODEL_CATEGORIES.includes(category.value as (typeof MODEL_CATEGORIES)[number])) {
    return { ok: false, error: "Select a valid model category." };
  }
  if (!track.value || !EVALUATION_TRACKS.includes(track.value as (typeof EVALUATION_TRACKS)[number])) {
    return { ok: false, error: "Select a valid evaluation track." };
  }
  if (!email.value || !EMAIL.test(email.value)) return { ok: false, error: "Enter a valid contact email." };
  if (!payload.githubCommit || !COMMIT_SHA.test(payload.githubCommit.trim())) {
    return { ok: false, error: "GitHub commit SHA must contain exactly 40 hexadecimal characters." };
  }
  if (!payload.checkpointRevision || !COMMIT_SHA.test(payload.checkpointRevision.trim())) {
    return { ok: false, error: "Hugging Face revision must be an immutable 40-character commit SHA." };
  }
  if (payload.confirmed !== true) return { ok: false, error: "Protocol confirmation is required." };

  const githubCommit = payload.githubCommit.trim().toLowerCase();
  const huggingfaceRevision = payload.checkpointRevision.trim().toLowerCase();
  return {
    ok: true,
    data: {
      modelName: modelName.value!,
      organization: organization.value!,
      category: category.value as ValidSubmission["category"],
      paperUrl: paper.value ?? null,
      githubRepository: github.value!,
      githubCommit,
      githubSnapshotUrl: `${github.value}/tree/${githubCommit}`,
      huggingfaceRepository: huggingface.value!,
      huggingfaceRevision,
      huggingfaceSnapshotUrl: `${huggingface.value}/tree/${huggingfaceRevision}`,
      contactEmail: email.value,
      evaluationTrack: track.value as ValidSubmission["evaluationTrack"],
      license: license.value,
      environment: environment.value,
      description: description.value,
    },
  };
}
