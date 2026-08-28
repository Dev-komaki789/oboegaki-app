import PeopleSidebar from "@/components/PeopleSidebar";

/**
 * タブレット（iPad ランドスケープ）だけ2カラムにする（§8）。
 * lg 未満はスマホ版のまま。子ページ側でも lg: で見た目を切り替えている。
 */
export default function PeopleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="lg:flex">
      <aside className="sticky top-0 hidden w-[340px] shrink-0 lg:block">
        <PeopleSidebar />
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
