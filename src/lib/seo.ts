import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { seoPages } from "@/config/seo-pages";

export function canonicalUrl(path = "/") {
  return new URL(path, `${siteConfig.primaryUrl}/`).toString();
}

export function createPageMetadata({ path, title, description, key }: {
  path: string; title: string; description: string; key: string;
}): Metadata {
  const fullTitle = path === "/" ? siteConfig.title : `${title} | ${siteConfig.name}`;
  const image = { url: canonicalUrl(`/social/${key}.png`), width: 1200, height: 630, alt: fullTitle };
  return {
    title: { absolute: fullTitle }, description,
    robots: {
      index: true, follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
    },
    alternates: { canonical: canonicalUrl(path) },
    openGraph: { type: "website", url: canonicalUrl(path), title: fullTitle, description, siteName: siteConfig.name, locale: "en_US", images: [image] },
    twitter: { card: "summary_large_image", title: fullTitle, description, images: [image.url] },
  };
}

export function pageMetadata(path: string) {
  const page = seoPages.find((item) => item.path === path);
  if (!page) throw new Error(`Missing page SEO definition: ${path}`);
  return createPageMetadata(page);
}
