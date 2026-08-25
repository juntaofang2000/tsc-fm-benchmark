import { demoMethods } from "@/data/demo/methods";
import { allOfficialEntries } from "@/data/official/leaderboard";
import type { Method } from "@/types";

const existingSlugs = new Set(demoMethods.map((method) => method.slug));
const generatedMethods: Method[] = Array.from(
  new Map(allOfficialEntries.map((entry) => [entry.slug, entry])).values(),
)
  .filter((entry) => !existingSlugs.has(entry.slug))
  .map((entry) => {
    const [backbone, head] = entry.model.split("+");
    const inContext = entry.evaluationType === "In-Context";
    return {
      id: entry.slug,
      name: entry.model,
      slug: entry.slug,
      organization: entry.organization,
      category: inContext ? "In-Context Learning" : "Representation Learning",
      description: inContext
        ? `${entry.model} is evaluated with training-free in-context classification.`
        : `Frozen ${backbone} representations evaluated with the ${head ?? "reported"} classification head.`,
      paperUrl: entry.paperUrl,
      codeUrl: entry.codeUrl,
      checkpointUrl: entry.checkpointUrl,
      parameterCount: "—",
      inputType: "Time series",
      inferenceParadigm: inContext ? "Training-free in-context classification" : "Frozen probe",
      evaluationStatus: "Complete",
    };
  });

const methods = [...demoMethods, ...generatedMethods];

export async function getMethods() {
  return methods;
}

export async function getMethod(slug: string) {
  return methods.find((method) => method.slug === slug) ?? null;
}
