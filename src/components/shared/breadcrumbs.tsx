import Link from "next/link";
import { canonicalUrl } from "@/lib/seo";
import { StructuredData } from "./structured-data";

export function Breadcrumbs({ items }: { items: { name: string; path: string }[] }) {
  const trail = [{ name: "Home", path: "/" }, ...items];
  return <div className="container-wide py-3">
    <nav aria-label="Breadcrumb"><ol className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
      {trail.map((item, index) => <li key={item.path} className="flex items-center gap-2">
        {index > 0 && <span aria-hidden="true">/</span>}
        {index === trail.length - 1 ? <span aria-current="page">{item.name}</span> : <Link className="hover:text-primary hover:underline" href={item.path}>{item.name}</Link>}
      </li>)}
    </ol></nav>
    <StructuredData data={{ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: trail.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.name, item: canonicalUrl(item.path) })) }} />
  </div>;
}
