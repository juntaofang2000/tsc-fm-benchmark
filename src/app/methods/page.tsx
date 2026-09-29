import Link from "next/link";
import { MethodTable } from "@/components/method/method-table";
import { PageHeader } from "@/components/shared/page-header";
import { getMethods } from "@/lib/data/methods";

import { canonicalUrl, pageMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { StructuredData } from "@/components/shared/structured-data";

export const metadata = pageMetadata("/methods");

export default async function MethodsPage() {
  const methods = await getMethods();
  const groups = [
    { category: "In-Context Learning", title: "In-context classification", description: "These configurations predict from labeled context examples without fitting a classifier for each target dataset. The catalog includes time series models as well as TabICL and TabICLv2, tabular foundation models applied to vectorized time series." },
    { category: "Representation Learning", title: "Frozen representations and classifier heads", description: "These configurations extract representations with a frozen pretrained encoder and use a downstream classifier. The classifier head is part of the evaluated configuration: two heads on the same backbone can produce different results." },
  ];
  return <>
    <StructuredData data={{
      "@context": "https://schema.org", "@type": "CollectionPage",
      "@id": canonicalUrl("/methods#webpage"), url: canonicalUrl("/methods"),
      name: "Foundation Models for Time Series Classification", inLanguage: "en",
      isPartOf: { "@id": canonicalUrl("/#website") },
      mainEntity: {
        "@type": "ItemList", name: "Evaluated foundation models", numberOfItems: methods.length,
        itemListElement: methods.map((method, index) => ({
          "@type": "ListItem", position: index + 1, name: method.name,
          url: canonicalUrl(`/methods/${method.slug}`), description: method.description,
        })),
      },
    }} />
    <Breadcrumbs items={[{ name: "Methods", path: "/methods" }]} />
    <PageHeader eyebrow="Model registry" title="Foundation Models for Time Series Classification" description={`Explore ${methods.length} pretrained models evaluated in TSC-FM Benchmark, with classifier configurations, papers, code and checkpoint references. Compare in-context classification with frozen representation learning.`} />
    <div className="container-wide space-y-10 py-10">
      <MethodTable methods={methods} />
      <section id="classification-models" className="prose-panel scroll-mt-24">
        <h2>How are foundation models used for time series classification?</h2>
        <p>A time series foundation model (TSFM) learns reusable representations or prediction behavior during pretraining. Time series classification (TSC) assigns a class label to an input sequence. This benchmark compares how pretrained models transfer to classification through two approaches: in-context inference and frozen features with a classifier head.</p>
        <p>A univariate sequence has one measured channel; a multivariate sequence has several. Check each model’s input type and the results for the relevant dataset scope before comparing scores. Catalog membership does not imply complete coverage of every evaluation setting.</p>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          {groups.map((group) => <div key={group.category} className="rounded-lg border border-border p-4">
            <h3 className="font-semibold">{group.title}</h3>
            <p>{group.description}</p>
            <ul>{methods.filter((method) => method.category === group.category).map((method) => <li key={method.id}><Link href={`/methods/${method.slug}`} className="text-primary underline underline-offset-4">{method.name}</Link></li>)}</ul>
          </div>)}
        </div>
      </section>
      <section id="compare-models" className="prose-panel scroll-mt-24">
        <h2>How to compare time series classification models</h2>
        <p>Use the <Link href="/leaderboard" className="text-primary underline underline-offset-4">time series classification leaderboard</Link> to compare average accuracy, average rank and dataset coverage under the same label budget and modality scope. The catalog groups classifier heads under one backbone; the leaderboard treats each evaluated configuration separately.</p>
        <p>Standard evaluation uses the official training split. For limited-label comparisons, select Low-shot and then 5-shot or 10-shot. These settings use different feasible dataset subsets, so a higher score across settings does not by itself establish a better model. Read the <Link href="/evaluation#low-shot" className="text-primary underline underline-offset-4">few-shot classification protocol</Link> before interpreting the results.</p>
        <p>Overall scores summarize performance across datasets. To investigate where models differ, use the <Link href="/capability-map" className="text-primary underline underline-offset-4">capability analysis by dataset attributes</Link>, which evaluates its own fixed comparison core. Model detail pages provide configuration results and source references for further inspection.</p>
      </section>
    </div>
  </>;
}
