import { Bar, Card } from "@/components/Skeleton";

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-[390px] px-5 pt-8">
      <Bar className="h-5 w-24" />
      <Bar className="mt-4 h-8 w-40" />
      <Bar className="mt-2 h-4 w-56" />
      <Bar className="mt-4 h-12 w-full" />
      <Card className="mt-4 h-40 w-full" />
      <div className="mt-5 flex justify-end gap-2">
        <Bar className="h-9 w-24 rounded-full" />
        <Bar className="h-9 w-24 rounded-full" />
      </div>
      <Card className="mt-4 h-24 w-full" />
    </main>
  );
}
