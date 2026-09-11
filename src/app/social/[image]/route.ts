import { seoPages } from "@/config/seo-pages";
import { siteConfig } from "@/config/site";
import { officialMethods } from "@/data/official/methods";
import { socialImage } from "@/lib/social-image";

export const dynamic = "force-static";
export const dynamicParams = false;

const cards = [
  ...seoPages.map((page) => ({ image: `${page.key}.png`, title: page.path === "/" ? siteConfig.subtitle : page.title, description: page.description })),
  ...officialMethods.map((method) => ({ image: `method-${method.slug}.png`, title: `${method.name}: Time Series Classification`, description: method.description })),
];

export function generateStaticParams() { return cards.map(({ image }) => ({ image })); }

export async function GET(_request: Request, { params }: { params: Promise<{ image: string }> }) {
  const image = (await params).image;
  const selected = cards.find((item) => item.image === image);
  if (!selected) return new Response("Not found", { status: 404 });
  return socialImage(selected);
}
