import { SearchX } from "lucide-react";

export function EmptyState({ title = "No results", description = "Try adjusting your search or filters." }: { title?: string; description?: string }) {
  return <div className="flex min-h-56 flex-col items-center justify-center px-6 text-center"><SearchX className="size-8 text-muted-foreground" /><p className="mt-4 font-medium">{title}</p><p className="mt-1 text-sm text-muted-foreground">{description}</p></div>;
}
