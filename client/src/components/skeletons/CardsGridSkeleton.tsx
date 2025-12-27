import { Skeleton } from "../ui/Skeleton";

export function CardsGridSkeleton({ count = 9 }: { count?: number }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="
            rounded-2xl
            border border-white/10
            bg-[#0B0B0B]
            p-4
          "
        >
          <Skeleton className="h-40 w-full rounded-xl bg-[#121212]" />

          <div className="mt-4 space-y-2">
            <Skeleton className="h-5 w-3/4 bg-[#121212]" />
            <Skeleton className="h-4 w-1/2 bg-[#121212]" />
          </div>
        </div>
      ))}
    </div>
  );
}
