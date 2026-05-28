import { cn } from "@/lib/cn";
import type { HTMLAttributes } from "react";

interface ToolbarProps extends HTMLAttributes<HTMLDivElement> {
  align?: "start" | "between" | "end";
  density?: "tight" | "normal";
}

const alignClass = {
  start: "justify-start",
  between: "justify-between",
  end: "justify-end",
} as const;

const densityClass = {
  tight: "gap-2",
  normal: "gap-3",
} as const;

/** Horizontal control group with consistent spacing. Wraps on small widths. */
export function Toolbar({
  className,
  align = "start",
  density = "normal",
  children,
  ...props
}: ToolbarProps) {
  return (
    <div
      role="toolbar"
      className={cn(
        "flex flex-wrap items-center",
        alignClass[align],
        densityClass[density],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
