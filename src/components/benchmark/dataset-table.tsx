import type { BenchmarkDataset } from "@/types";

const display = (value: string | number | null) => value === null ? "—" : value.toLocaleString();

export function DatasetTable({ datasets }: { datasets: BenchmarkDataset[] }) {
  return <div className="overflow-x-auto rounded-xl border border-border"><table className="w-full min-w-[720px] text-sm"><thead className="bg-muted/70"><tr>{["Dataset", "Train Size", "Test Size", "Length", "Channels", "Classes"].map((label) => <th key={label} className="h-11 border-b border-border px-4 text-left text-xs font-medium text-muted-foreground">{label}</th>)}</tr></thead><tbody>{datasets.map((item) => <tr key={item.dataset} className="border-b border-border/70 last:border-0 hover:bg-muted/30"><td className="h-13 px-4 font-medium">{item.dataset}</td><td className="px-4 tabular-nums">{display(item.trainSize)}</td><td className="px-4 tabular-nums">{display(item.testSize)}</td><td className="px-4 tabular-nums">{display(item.length)}</td><td className="px-4 tabular-nums">{display(item.channels)}</td><td className="px-4 tabular-nums">{display(item.classes)}</td></tr>)}</tbody></table></div>;
}
