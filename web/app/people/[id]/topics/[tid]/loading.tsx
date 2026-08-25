import { Bar, Card } from "@/components/Skeleton";

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-[390px] px-5 pt-8">
      <Bar className="h-5 w-24" />
      <div className="mt-4 flex items-end justify-between">
        <Bar className="h-8 w-32" />
        <Bar className="h-10 w-16" />
      </div>
      <div className="mt-5 flex gap-2">
        <Bar className="h-9 w-24 rounded-full" />
        <Bar className="h-9 w-20 rounded-full" />
      </div>
      <Bar className="mt-8 h-5 w-24" />
      <Card className="mt-3 h-56 w-full" />
    </main>
  );
}
