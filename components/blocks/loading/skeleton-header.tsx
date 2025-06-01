import { Skeleton } from "./skeleton";

export function SkeletonHeader() {
  return (
    <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="flex items-center gap-6 md:gap-10">
          <Skeleton className="h-8 w-32" delay={0} />
        </div>
        
        <div className="flex flex-1 items-center justify-end space-x-4">
          <div className="hidden md:flex items-center space-x-4">
            <Skeleton className="h-5 w-16" delay={150} />
            <Skeleton className="h-5 w-20" delay={200} />
            <Skeleton className="h-5 w-16" delay={250} />
          </div>
          
          <div className="flex items-center space-x-4">
            <Skeleton className="h-9 w-9 rounded-full" delay={300} />
          </div>
        </div>
      </div>
    </header>
  );
}