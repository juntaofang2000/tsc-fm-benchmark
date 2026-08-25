import capabilityData from "@/data/official/capability-map.json";
import { CapabilityMapView } from "@/components/capability/capability-map-view";
import { PageHeader } from "@/components/shared/page-header";
import type { CapabilityBundle } from "@/types/capability";

export const metadata = {
  title: "Capability Map",
  description: "Explore where time series classification foundation model paradigms are effective and where evidence remains limited.",
};

export default function CapabilityMapPage() {
  return (
    <>
      <PageHeader
        compact
        eyebrow="Evidence by task condition"
        title="Capability Map"
        description="Move beyond a single overall score to examine where TSC-FM paradigms work, where they fail, and how much evidence supports each comparison."
      />
      <CapabilityMapView data={capabilityData as unknown as CapabilityBundle} />
    </>
  );
}
