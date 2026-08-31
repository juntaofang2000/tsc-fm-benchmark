"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { Boxes, Menu, X } from "lucide-react";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
      <span className="flex size-7 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">CT</span>
      <span className="whitespace-nowrap">TSC-FM <span className="hidden text-muted-foreground lg:inline">Benchmark</span></span>
    </Link>
  );
}

function ExternalLinks() {
  return (
    <div className="flex items-center">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" asChild><a href={siteConfig.links.huggingFace} target="_blank" rel="noreferrer" aria-label="Hugging Face"><Boxes className="size-4" /></a></Button>
        </TooltipTrigger>
        <TooltipContent>Hugging Face</TooltipContent>
      </Tooltip>
      <ThemeToggle />
    </div>
  );
}

export function Navbar() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/95 backdrop-blur">
      <div className="container-wide flex h-15 items-center justify-between gap-4">
        <Brand />
        <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Primary navigation">
          {siteConfig.nav.map((item) => (
            <Link key={item.href} href={item.href} className={cn("rounded-md px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:px-3", pathname === item.href && "bg-muted text-foreground")}>{item.label}</Link>
          ))}
        </nav>
        <div className="hidden xl:block"><ExternalLinks /></div>
        <div className="lg:hidden">
          <Dialog.Root>
            <Dialog.Trigger asChild><Button variant="ghost" size="icon" aria-label="Open navigation"><Menu className="size-5" /></Button></Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-black/35" />
              <Dialog.Content className="fixed inset-y-0 right-0 z-50 w-[min(88vw,360px)] border-l border-border bg-background p-5 shadow-xl">
                <div className="flex items-center justify-between"><Brand /><Dialog.Close asChild><Button variant="ghost" size="icon" aria-label="Close navigation"><X className="size-5" /></Button></Dialog.Close></div>
                <nav className="mt-8 flex flex-col gap-1" aria-label="Mobile navigation">
                  {siteConfig.nav.map((item) => <Dialog.Close key={item.href} asChild><Link href={item.href} className={cn("rounded-md px-3 py-2.5 text-sm text-muted-foreground", pathname === item.href && "bg-muted text-foreground")}>{item.label}</Link></Dialog.Close>)}
                </nav>
                <div className="mt-6 border-t border-border pt-4"><ExternalLinks /></div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </div>
    </header>
  );
}
