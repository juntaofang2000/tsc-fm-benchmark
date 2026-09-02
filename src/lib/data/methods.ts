import { canonicalMethodSlug, methodAliases, officialMethods } from "@/data/official/methods";

export async function getMethods() {
  return officialMethods;
}

export async function getMethod(slug: string) {
  const canonical = canonicalMethodSlug(slug);
  return officialMethods.find((method) => method.slug === canonical) ?? null;
}

export async function getMethodStaticSlugs() {
  return [...officialMethods.map((method) => method.slug), ...Object.keys(methodAliases)];
}
