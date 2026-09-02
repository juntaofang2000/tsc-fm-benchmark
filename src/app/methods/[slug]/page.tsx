import { notFound } from "next/navigation";
import { MethodDetailTabs } from "@/components/method/method-detail-tabs";
import { MethodHeader } from "@/components/method/method-header";
import { getLeaderboardEntry } from "@/lib/data/leaderboard";
import { getMethod, getMethodStaticSlugs } from "@/lib/data/methods";

export async function generateStaticParams() { return (await getMethodStaticSlugs()).map((slug) => ({ slug })); }

export default async function MethodPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [method, result] = await Promise.all([getMethod(slug), getLeaderboardEntry(slug)]);
  if (!method) notFound();
  return <><MethodHeader method={method} /><div className="container-wide py-10"><MethodDetailTabs method={method} result={result} /></div></>;
}
