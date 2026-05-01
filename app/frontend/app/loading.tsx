import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8 lg:py-10">
        <section className="rounded-3xl border border-slate-200 bg-white px-6 py-7 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-28 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-40 rounded-full" />
          </div>

          <div className="mt-5 max-w-3xl space-y-3">
            <Skeleton className="h-10 w-[420px] max-w-full rounded-xl" />
            <Skeleton className="h-4 w-full rounded-lg" />
            <Skeleton className="h-4 w-[80%] rounded-lg" />
          </div>
        </section>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <Skeleton className="h-6 w-32 rounded-lg" />
            <Skeleton className="mt-2 h-4 w-52 rounded-lg" />
            <Skeleton className="mt-6 h-32 w-full rounded-2xl" />
            <div className="mt-6 grid grid-cols-2 gap-4">
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-20 w-full rounded-xl" />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <Skeleton className="h-6 w-36 rounded-lg" />
            <Skeleton className="mt-2 h-4 w-64 rounded-lg" />
            <div className="mt-6 flex gap-2">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Skeleton className="h-36 w-full rounded-2xl" />
              <Skeleton className="h-36 w-full rounded-2xl" />
            </div>
            <Skeleton className="mt-6 h-px w-full" />
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Skeleton className="h-28 w-full rounded-xl" />
              <Skeleton className="h-28 w-full rounded-xl" />
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <Skeleton className="h-6 w-40 rounded-lg" />
          <Skeleton className="mt-2 h-4 w-72 rounded-lg" />
          <Skeleton className="mt-6 h-[380px] w-full rounded-2xl" />
        </div>
      </div>
    </main>
  );
}
