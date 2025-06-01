import { Skeleton } from "./skeleton";

export function SkeletonFooter() {
  return (
    <footer className="border-t border-border/40 bg-background py-6">
      <div className="container max-w-screen-2xl">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="space-y-3">
            <Skeleton className="h-8 w-32" delay={1000} />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full max-w-[200px]" delay={1050} />
              <Skeleton className="h-4 w-4/5 max-w-[180px]" delay={1100} />
            </div>
          </div>
          
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="space-y-3">
              <Skeleton className="h-5 w-24" delay={1150 + index * 50} />
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton 
                    key={i} 
                    className="h-4 w-24" 
                    delay={1200 + index * 50 + i * 50} 
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-8 flex flex-col items-center justify-between border-t border-border/40 pt-6 md:flex-row">
          <Skeleton className="h-4 w-full max-w-[300px] md:max-w-[200px]" delay={1400} />
          <div className="mt-4 flex space-x-4 md:mt-0">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton 
                key={i} 
                className="h-8 w-8 rounded-full" 
                delay={1450 + i * 50} 
              />
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}