"use client";

import * as React from "react";
import { cn } from "./utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
}

function Progress({ className, value = 0, max = 100, ...props }: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  // Extract bg- color classes from className to apply to inner div
  const bgColorMatch = className?.match(/(bg-\w+-\d+)/);
  const bgColor = bgColorMatch ? bgColorMatch[1] : "bg-indigo-500";
  // Remove bg- color classes from container className
  const containerClass = className?.replace(/(bg-\w+-\d+)/g, "").trim() || "";

  return (
    <div
      className={cn("relative h-2 w-full overflow-hidden rounded-full bg-slate-200", containerClass)}
      {...props}
    >
      <div
        className={cn("h-full transition-all duration-300 ease-in-out rounded-full", bgColor)}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

export { Progress };

