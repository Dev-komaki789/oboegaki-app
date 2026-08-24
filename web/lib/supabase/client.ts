import { createBrowserClient } from "@supabase/ssr";

/** Client Component から使う Supabase の窓口。 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
