import { DemoDataBadge } from "./demo-data-badge";

export function PageHeader({
  eyebrow,
  title,
  description,
  demo = false,
  compact = false,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  demo?: boolean;
  compact?: boolean;
}) {
  return (
    <div className="border-b border-border bg-muted/15">
      <div className={compact ? "container-wide py-6 md:py-7" : "container-wide py-10 md:py-14"}>
        <div className="flex flex-wrap items-center gap-3">
          {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>}
          {demo && <DemoDataBadge />}
        </div>
        <h1 className={compact ? "mt-2 text-3xl font-semibold tracking-tight" : "mt-3 text-3xl font-semibold tracking-tight md:text-4xl"}>{title}</h1>
        <p className={compact ? "mt-2 max-w-3xl text-sm leading-6 text-muted-foreground md:text-base" : "mt-3 max-w-3xl text-base leading-7 text-muted-foreground"}>{description}</p>
      </div>
    </div>
  );
}
