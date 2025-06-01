import { SkeletonHeader } from "./skeleton-header";
import { SkeletonContent } from "./skeleton-content";
import { SkeletonFooter } from "./skeleton-footer";

export function PageSkeleton() {
  return (
    <div className="w-full min-h-screen flex flex-col">
      <SkeletonHeader />
      <main className="flex-1">
        <SkeletonContent />
      </main>
      <SkeletonFooter />
    </div>
  );
}