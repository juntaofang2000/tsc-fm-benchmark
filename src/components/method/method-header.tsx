import { Code2, FileText, Package } from "lucide-react";
import type { Method, MethodResultGroup } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function MethodHeader({ method, results }: { method: Method; results: MethodResultGroup[] }) {
  const standardScopes = results.filter((group) => group.setting === "Standard").map((group) => group.scope);
  const status = standardScopes.includes("Overall") ? "Standard Overall results available" : standardScopes.length ? `Standard ${standardScopes.join(" / ")} results available` : results.length ? "Low-shot results available" : "No published results";
  const links = [
    { label: "Paper", href: method.paperUrl, icon: FileText },
    { label: "Code", href: method.codeUrl, icon: Code2 },
    { label: "Checkpoint", href: method.checkpointUrl, icon: Package },
  ];
  return <div className="border-b border-border bg-muted/15"><div className="container-wide py-10 md:py-14"><div className="flex flex-wrap items-center gap-3"><Badge>{method.category}</Badge><Badge variant="outline">{status}</Badge></div><h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">{method.name}</h1><p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">{method.description}</p><div className="mt-6 flex flex-wrap gap-2">{links.map(({ label, href, icon: Icon }) => href && <Button key={label} variant="outline" size="sm" asChild><a href={href} target="_blank" rel="noreferrer"><Icon className="size-4" />{label}</a></Button>)}</div></div></div>;
}
