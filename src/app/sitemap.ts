import type { MetadataRoute } from "next";
import { seoPages } from "@/config/seo-pages";
import { officialMethods } from "@/data/official/methods";
import { canonicalUrl } from "@/lib/seo";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  // Only canonical, indexable pages. Do not invent lastmod dates at build time.
  return [...seoPages.map((page) => page.path), ...officialMethods.map((method) => `/methods/${method.slug}`)]
    .map((path) => ({ url: canonicalUrl(path) }));
}
