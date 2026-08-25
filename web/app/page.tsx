import { redirect } from "next/navigation";

/**
 * ルート（/）はそれ自体の画面を持たない。
 * 未ログインなら middleware が /login へ送るので、ここに来るのはログイン済みの人だけ。
 * その人が見たいのは一覧なので、そのまま /people へ送る。
 */
export default function Page() {
  redirect("/people");
}
