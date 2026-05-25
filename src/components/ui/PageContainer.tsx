import { cn } from "@/lib/cn";
import type { HTMLAttributes } from "react";

type PageContainerSize = "sm" | "md" | "narrow" | "wide" | "lg" | "xl";

const sizeClass: Record<PageContainerSize, string> = {
  sm: "max-w-lg",
  md: "max-w-2xl",
  narrow: "max-w-3xl",
  wide: "max-w-4xl",
  lg: "max-w-5xl",
  xl: "max-w-6xl",
};

interface PageContainerProps extends HTMLAttributes<HTMLDivElement> {
  size?: PageContainerSize;
}

export function PageContainer({
  size = "lg",
  className,
  children,
  ...props
}: PageContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full min-w-0 overflow-x-hidden px-3 py-4 pb-24 sm:px-4 md:p-8 md:pb-8",
        sizeClass[size],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
