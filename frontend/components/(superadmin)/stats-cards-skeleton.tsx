import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function StatsCardsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-3 mb-8">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="size-4 rounded-full" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
