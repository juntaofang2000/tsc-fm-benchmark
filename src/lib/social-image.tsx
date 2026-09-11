import { ImageResponse } from "next/og";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { siteConfig } from "@/config/site";
import { benchmarkProfile } from "@/data/official/benchmark-profile";

const brandMark = `data:image/svg+xml;base64,${readFileSync(join(process.cwd(), "public/tsc-fm-mark.svg")).toString("base64")}`;

export function socialImage({ title, description }: { title: string; description: string }) {
  return new ImageResponse(
    <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", background: "#f8f9ff", padding: "48px 60px", color: "#17213d", fontFamily: "sans-serif", borderTop: "12px solid #3948c6" }}>
      <div style={{ display: "flex", alignItems: "center", fontSize: 24, color: "#3948c6", fontWeight: 700 }}>
        {/* ImageResponse embeds the shared SVG directly in the generated PNG. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={brandMark} alt="" width={64} height={64} style={{ marginRight: 18 }} />
        {siteConfig.name}
      </div>
      <div style={{ display: "flex", fontSize: title.length > 65 ? 46 : 54, lineHeight: 1.12, fontWeight: 700, marginTop: 32, maxWidth: 1050 }}>{title}</div>
      <div style={{ display: "flex", fontSize: 23, lineHeight: 1.4, color: "#52617d", marginTop: 22, maxWidth: 1040 }}>{description}</div>
      <div style={{ display: "flex", marginTop: "auto", alignItems: "center", borderTop: "1px solid #d5dbef", paddingTop: 20, fontSize: 20 }}>
        <span style={{ marginRight: 26, color: "#52617d" }}>Benchmark composition</span>
        <span style={{ marginRight: 26 }}>{benchmarkProfile.totalDatasetCount} datasets</span>
        <span style={{ marginRight: 26 }}>{benchmarkProfile.univariateCount} univariate</span>
        <span>{benchmarkProfile.multivariateCount} multivariate</span>
      </div>
    </div>, { width: 1200, height: 630 },
  );
}
