import { Skeleton } from "./skeleton";
import { SkeletonCard } from "./skeleton-card";

export function SkeletonContent() {
  return (
    <div className="container max-w-screen-2xl py-8">
      <div className="space-y-10">
        <section className="space-y-4">
          <Skeleton className="h-8 w-48 md:w-64" delay={100} />
          <Skeleton className="h-4 w-full max-w-lg" delay={150} />
          
          <div className="grid grid-cols-1 gap-4 pt-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <SkeletonCard key={index} delay={200 + index * 100} />
            ))}
          </div>
        </section>
        
        <section className="space-y-4">
          <Skeleton className="h-7 w-40 md:w-52" delay={550} />
          
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" delay={600} />
            <Skeleton className="h-4 w-full" delay={650} />
            <Skeleton className="h-4 w-3/4" delay={700} />
          </div>
          
          <div className="grid grid-cols-1 gap-4 pt-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="h-32 w-full rounded-lg" delay={750 + index * 50} />
                <Skeleton className="h-4 w-3/4" delay={900 + index * 50} />
                <Skeleton className="h-4 w-1/2" delay={950 + index * 50} />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}