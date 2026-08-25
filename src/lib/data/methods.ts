import { demoMethods } from "@/data/demo/methods";

export async function getMethods() {
  return demoMethods;
}

export async function getMethod(slug: string) {
  return demoMethods.find((method) => method.slug === slug) ?? null;
}
