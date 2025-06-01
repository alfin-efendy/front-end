import { Skeleton } from "./skeleton";

export function SkeletonCard({ delay = 0 }: { delay?: number }) {
  return (
    <div className="rounded-lg border border-border/40 bg-card p-5 shadow-sm">
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <Skeleton className="h-10 w-10 rounded-full" delay={delay} />
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" delay={delay + 50} />
            <Skeleton className="h-3 w-16" delay={delay + 100} />
          </div>
        </div>
        
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" delay={delay + 150} />
          <Skeleton className="h-4 w-full" delay={delay + 200} />
          <Skeleton className="h-4 w-2/3" delay={delay + 250} />
        </div>
        
        <div className="flex justify-between items-center">
          <Skeleton className="h-9 w-20 rounded-md" delay={delay + 300} />
          <Skeleton className="h-7 w-7 rounded-full" delay={delay + 350} />
        </div>
      </div>
    </div>
  );
}