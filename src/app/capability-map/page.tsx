import { PageHeader } from "@/components/shared/page-header";
import { CapabilityMapView } from "@/components/capability/capability-map-view";
import capabilityData from "@/data/official/public-capability-map.json";
import type { CapabilityBundle } from "@/types/capability";

export const metadata = {
  title: "Capability Map",
  description: "Hierarchical capability analysis across a fixed 198-dataset core, 12 complete configurations, and 7 model backbones.",
};

export default function CapabilityMapPage() {
  return (
    <>
      <PageHeader
        eyebrow="Aggregate analysis"
        title="Capability Map"
        description="Explore a fixed full-coverage core through separate Evaluation Paradigm and Model Origin taxonomies, with backbone- and dataset-equal aggregation."
      />
      <CapabilityMapView data={capabilityData as CapabilityBundle} />
    </>
  );
}
