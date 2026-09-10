import { notFound } from "next/navigation";
import { MethodDetailTabs } from "@/components/method/method-detail-tabs";
import { MethodHeader } from "@/components/method/method-header";
import { getMethodResults } from "@/lib/data/leaderboard";
import { getMethod, getMethodStaticSlugs } from "@/lib/data/methods";
import Link from "next/link";
import { createPageMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const method = await getMethod((await params).slug);
  if (!method) notFound();
  return createPageMetadata({ path: `/methods/${method.slug}`, title: `${method.name}: Time Series Classification Evaluation`, description: `${method.description} Explore evaluated configurations, model provenance, paper, code and checkpoint references.`, key: `method-${method.slug}` });
}

export async function generateStaticParams() { return (await getMethodStaticSlugs()).map((slug) => ({ slug })); }

export default async function MethodPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [method, results] = await Promise.all([getMethod(slug), getMethodResults(slug)]);
  if (!method) notFound();
  return <>
    <Breadcrumbs items={[{ name: "Methods", path: "/methods" }, { name: method.name, path: `/methods/${method.slug}` }]} />
    <MethodHeader method={method} results={results} />
    <div className="container-wide py-10">
      <MethodDetailTabs method={method} results={results} />
      <section className="mt-8 rounded-xl border border-border p-5">
        <h2 className="font-semibold">Reading this model&apos;s evaluation</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">The method catalog describes the pretrained model; leaderboard eligibility depends on the actual coverage of each experimental configuration. Catalog inclusion does not imply complete coverage of all 198 datasets.</p>
        <div className="mt-4 flex flex-wrap gap-5 text-sm">
          <Link className="text-primary underline underline-offset-4" href="/leaderboard">Compare evaluated configurations</Link>
          <Link className="text-primary underline underline-offset-4" href="/evaluation">Read the evaluation and ranking rules</Link>
          <Link className="text-primary underline underline-offset-4" href="/capability-map">Explore aggregate capability analysis</Link>
        </div>
      </section>
    </div>
  </>;
}
