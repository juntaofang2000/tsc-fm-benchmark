import { Card, CardContent } from "@/components/ui/card";

export function MetricCard({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <Card><CardContent className="pt-5"><p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>{note && <p className="mt-1 text-xs text-muted-foreground">{note}</p>}</CardContent></Card>
  );
}
