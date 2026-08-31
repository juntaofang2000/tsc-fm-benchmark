import { PageHeader } from "@/components/shared/page-header";
import { CapabilityMapView } from "@/components/capability/capability-map-view";
import capabilityData from "@/data/official/public-capability-map.json";
import type { CapabilityBundle } from "@/types/capability";

export const metadata = {
  title: "Capability Map",
  description: "Aggregate capability analysis across benchmark modality and five reviewed dataset attributes.",
};

export default function CapabilityMapPage() {
  return (
    <>
      <PageHeader
        eyebrow="Aggregate analysis"
        title="Capability Map"
        description="Explore paradigm performance by modality and reviewed dataset attributes, with property-specific coverage and no dataset-level identities."
      />
      <CapabilityMapView data={capabilityData as CapabilityBundle} />
    </>
  );
}
