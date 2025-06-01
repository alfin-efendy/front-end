"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  delay?: number;
}

export function Skeleton({ className, delay = 0, ...props }: SkeletonProps) {
  const [isVisible, setIsVisible] = useState(delay === 0);
  
  useEffect(() => {
    if (delay === 0) return;
    
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [delay]);
  
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted/70",
        isVisible ? "opacity-100" : "opacity-0",
        "transition-opacity duration-500",
        className
      )}
      {...props}
    />
  );
}