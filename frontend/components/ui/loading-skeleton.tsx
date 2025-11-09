import { Skeleton } from '@/components/ui/skeleton';

interface LoadingSkeletonProps {
  className?: string;
}

export function LoadingSkeleton({ className }: LoadingSkeletonProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-8 ${className}`}
    >
      <Skeleton className="h-12 w-12 rounded-full mb-4" />
      <Skeleton className="h-4 w-32" />
    </div>
  );
}
