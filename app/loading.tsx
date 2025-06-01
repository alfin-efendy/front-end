"use client";

import { useEffect, useState } from "react";
import { PageSkeleton } from "@/components/blocks/loading/page-skeleton";
import { ProgressIndicator } from "@/components/blocks/loading/progress-indicator";

export default function Loading() {
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setProgress(10);
    }, 100);
    
    const interval = setInterval(() => {
      setProgress((prevProgress) => {
        const increment = Math.random() * 15;
        const newProgress = Math.min(prevProgress + increment, 90);
        
        if (newProgress >= 90) {
          clearInterval(interval);
        }
        
        return newProgress;
      });
    }, 700);
    
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ProgressIndicator progress={progress} />
      <PageSkeleton />
    </div>
  );
}