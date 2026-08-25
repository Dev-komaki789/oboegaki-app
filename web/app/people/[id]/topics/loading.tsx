import { Bar, Card } from "@/components/Skeleton";

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-[430px] px-5 pt-8">
      <Bar className="h-5 w-24" />
      <Bar className="mt-4 h-12 w-full" />
      <Card className="mt-4 h-[300px] w-full rounded-full" />
      <Bar className="mt-8 h-5 w-32" />
      <div className="mt-3 space-y-2">
        {[0, 1, 2].map((i) => (
          <Card key={i} className="h-24 w-full" />
        ))}
      </div>
    </main>
  );
}
