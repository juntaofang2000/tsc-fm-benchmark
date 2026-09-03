import { PageHeader } from "@/components/shared/page-header";
import { CapabilityMapView } from "@/components/capability/capability-map-view";
import capabilityData from "@/data/official/public-capability-map.json";
import type { CapabilityBundle } from "@/types/capability";

import { pageMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";

export const metadata = pageMetadata("/capability-map");

export default function CapabilityMapPage() {
  return (
    <>
      <Breadcrumbs items={[{ name: "Capability Map", path: "/capability-map" }]} />
      <PageHeader
        eyebrow="Aggregate analysis"
        title="Capability Map"
        description="Explore a fixed full-coverage core through separate Evaluation Paradigm and Model Origin taxonomies, with backbone- and dataset-equal aggregation."
      />
      <CapabilityMapView data={capabilityData as CapabilityBundle} />
    </>
  );
}
