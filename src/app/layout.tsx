import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/next";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { siteConfig } from "@/config/site";
import { StructuredData } from "@/components/shared/structured-data";
import "./globals.css";

export const metadata: Metadata = {
  // Resolve local assets against the actual host. All canonical/OG URLs are
  // explicit primary URLs; this also prevents Pages' trailingSlash setting
  // from changing the canonical URL format used by Vercel.
  metadataBase: new URL(siteConfig.isStaticMirror ? process.env.NEXT_PUBLIC_SITE_URL || siteConfig.primaryUrl : siteConfig.primaryUrl),
  title: { default: siteConfig.title, template: `%s | ${siteConfig.name}` },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  authors: [{ name: siteConfig.maintainer.name, url: siteConfig.maintainer.url }],
  verification: process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : undefined,
  icons: { icon: { url: `${siteConfig.basePath}/dmir-lab-icon.png`, type: "image/png" } },
};

export const viewport: Viewport = { colorScheme: "light dark", themeColor: [{ media: "(prefers-color-scheme: light)", color: "#ffffff" }, { media: "(prefers-color-scheme: dark)", color: "#09090b" }] };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" suppressHydrationWarning><body><StructuredData data={{ "@context": "https://schema.org", "@type": "WebSite", "@id": `${siteConfig.primaryUrl}/#website`, url: `${siteConfig.primaryUrl}/`, name: siteConfig.name, alternateName: [siteConfig.shortName, siteConfig.title], sameAs: [siteConfig.links.huggingFace], image: `${siteConfig.primaryUrl}/social/home.png`, description: siteConfig.description, inLanguage: "en", publisher: siteConfig.publishers.map((publisher) => ({ "@type": "Organization", name: publisher.name, ...("url" in publisher ? { url: publisher.url } : {}) })), maintainer: { "@type": "Person", name: siteConfig.maintainer.name, url: siteConfig.maintainer.url } }} /><ThemeProvider><TooltipProvider delayDuration={250}><div className="flex min-h-screen flex-col"><Navbar /><main className="flex-1">{children}</main><Footer /></div><Toaster richColors position="bottom-right" /></TooltipProvider></ThemeProvider>{!siteConfig.isStaticMirror && <Analytics />}</body></html>;
}
