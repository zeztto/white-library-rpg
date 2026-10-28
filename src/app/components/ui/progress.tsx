"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "./utils";

function Progress({
  className,
  value,
  max,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  const maximum = typeof max === 'number' && Number.isFinite(max) && max > 0 ? max : 100;
  const boundedValue = typeof value === 'number' && Number.isFinite(value)
    ? Math.min(maximum, Math.max(0, value)) : null;
  const percentage = boundedValue === null ? 0 : (boundedValue / maximum) * 100;
  return (
    <ProgressPrimitive.Root
      value={boundedValue}
      max={maximum}
      data-slot="progress"
      className={cn(
        "bg-primary/20 relative h-2 w-full overflow-hidden rounded-full",
        className,
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="bg-primary h-full w-full flex-1 transition-all"
        style={{ transform: `translateX(-${100 - percentage}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };
