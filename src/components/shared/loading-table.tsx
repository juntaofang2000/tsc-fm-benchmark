export function LoadingTable() {
  return <div className="overflow-hidden rounded-xl border border-border" aria-label="Loading table"><div className="h-11 animate-pulse bg-muted" />{Array.from({ length: 6 }).map((_, index) => <div key={index} className="grid grid-cols-5 gap-5 border-t border-border p-4"><div className="h-4 animate-pulse rounded bg-muted" /><div className="h-4 animate-pulse rounded bg-muted" /><div className="h-4 animate-pulse rounded bg-muted" /><div className="h-4 animate-pulse rounded bg-muted" /><div className="h-4 animate-pulse rounded bg-muted" /></div>)}</div>;
}
