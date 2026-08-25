import { Bar, Card } from "@/components/Skeleton";

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-[390px] px-5 pt-8">
      <Bar className="h-6 w-full" />
      <Bar className="mt-6 h-5 w-20" />
      <Bar className="mt-2 h-14 w-full" />
      <div className="mt-3 flex flex-wrap gap-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <Bar key={i} className="h-12 w-24 rounded-full" />
        ))}
      </div>
      <Bar className="mt-8 h-5 w-28" />
      <Bar className="mt-2 h-14 w-full" />
      <Card className="mt-8 h-24 w-full" />
    </main>
  );
}
