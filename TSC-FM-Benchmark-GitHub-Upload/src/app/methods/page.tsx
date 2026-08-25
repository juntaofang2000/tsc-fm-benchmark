import { MethodTable } from "@/components/method/method-table";
import { PageHeader } from "@/components/shared/page-header";
import { getMethods } from "@/lib/data/methods";

export const metadata = { title: "Methods" };

export default async function MethodsPage() {
  const methods = await getMethods();
  return <><PageHeader eyebrow="Model registry" title="Methods" description="Reference methods evaluated across the benchmark's standard, low-shot, OOD, in-context, and frozen-probe tracks." demo /><div className="container-wide py-10"><MethodTable methods={methods} /></div></>;
}
