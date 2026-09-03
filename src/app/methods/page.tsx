import { MethodTable } from "@/components/method/method-table";
import { PageHeader } from "@/components/shared/page-header";
import { getMethods } from "@/lib/data/methods";

import { pageMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";

export const metadata = pageMetadata("/methods");

export default async function MethodsPage() {
  const methods = await getMethods();
  return <><Breadcrumbs items={[{ name: "Methods", path: "/methods" }]} /><PageHeader eyebrow="Model registry" title="Methods" description="Ten pretrained models evaluated across the benchmark. Classifier heads are grouped under their shared backbone; the leaderboard retains each evaluated configuration separately." /><div className="container-wide py-10"><MethodTable methods={methods} /></div></>;
}
