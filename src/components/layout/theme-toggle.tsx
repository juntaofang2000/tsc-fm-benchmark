"use client";

import { useSyncExternalStore } from "react";
import { Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const themes = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Laptop },
] as const;

export function ThemeToggle() {
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const { theme, setTheme } = useTheme();
  if (!mounted) return <div className="size-9" aria-hidden />;
  const currentIndex = Math.max(0, themes.findIndex((item) => item.value === theme));
  const current = themes[currentIndex];
  const Icon = current.icon;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Theme: ${current.label}. Click to change.`}
          onClick={() => setTheme(themes[(currentIndex + 1) % themes.length].value)}
        >
          <Icon className="size-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Theme: {current.label}</TooltipContent>
    </Tooltip>
  );
}
