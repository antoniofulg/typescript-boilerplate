import { Skeleton } from '@/components/ui/skeleton';

type LoadingSkeletonProps = {
  className?: string;
};

export function LoadingSkeleton({ className }: LoadingSkeletonProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-8 ${className}`}
    >
      <Skeleton className="size-12 rounded-full mb-4" />
      <Skeleton className="h-4 w-32" />
    </div>
  );
}
