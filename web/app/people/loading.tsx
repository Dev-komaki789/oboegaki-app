import { Bar, Card } from "@/components/Skeleton";

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-[430px] px-5 pt-8">
      <Bar className="h-8 w-32" />
      <Bar className="mt-5 h-14 w-full" />
      <div className="mt-4 space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <Card key={i} className="h-24 w-full" />
        ))}
      </div>
    </main>
  );
}
