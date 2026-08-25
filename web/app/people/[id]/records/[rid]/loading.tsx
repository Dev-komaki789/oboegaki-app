import { Bar, Card } from "@/components/Skeleton";

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-[390px] px-5 pt-8">
      <Bar className="h-6 w-40" />
      <Card className="mt-5 h-28 w-full" />
      <Bar className="mt-8 h-5 w-28" />
      <Bar className="mt-4 h-11 w-full" />
      <Bar className="mt-8 h-5 w-24" />
      <Card className="mt-2 h-28 w-full" />
    </main>
  );
}
