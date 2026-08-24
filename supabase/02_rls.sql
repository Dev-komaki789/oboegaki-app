-- ============================================================
-- 02_rls.sql — RLS（行レベルセキュリティ）
--
-- 2026-08-24 に実行して成功したもの。01_schema.sql のあとに流す。
--
-- このアプリは app/api/ を1本も書かず、ブラウザ／Server Component から
-- Supabase を直接呼ぶ（開発ログ 06）。つまり DB への入口が外に開いている。
-- anon key はビルド後の JS に含まれるので誰でも読める。
-- ★ RLS が無いと、その鍵で全ユーザーの顧客情報が丸ごと取れる。
--
-- RLS があると、アプリ側で where user_id = ... を書く必要がない。
-- PostgreSQL が勝手に条件を足すため、書き忘れによる漏洩が起きない。
-- ============================================================

-- ── users：自分の行だけ ───────────────────────────
-- （§4 に記載が無いが、これが無いと自分の行すら読めない）
alter table users enable row level security;
create policy "self only" on users for select
  using (id = auth.uid());

-- ── people / keywords：user_id で直接判定 ──────────
alter table people enable row level security;
create policy "own rows only" on people for all
  using      (user_id = auth.uid())
  with check (user_id = auth.uid());

-- （§4 は文中で keywords に触れているが SQL が無いので補った）
alter table keywords enable row level security;
create policy "own rows only" on keywords for all
  using      (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ── topics / records：親をたどって判定 ──────────────
-- topics/records に user_id は持たせない。person_id → people → user_id と辿る。
-- 同じ情報を2箇所に持つとズレるため（開発ログ 02）。
--
-- （§4 は文中で topics に触れているが SQL が無いので補った）
alter table topics enable row level security;
create policy "own rows only" on topics for all
  using      (exists (select 1 from people p
                      where p.id = topics.person_id and p.user_id = auth.uid()))
  with check (exists (select 1 from people p
                      where p.id = topics.person_id and p.user_id = auth.uid()));

alter table records enable row level security;
create policy "own rows only" on records for all
  using      (exists (select 1 from people p
                      where p.id = records.person_id and p.user_id = auth.uid()))
  with check (exists (select 1 from people p
                      where p.id = records.person_id and p.user_id = auth.uid()));

-- ── topic_masters：自分のもの、または全員共通 ────────
-- 初期話題マスタ10件は user_id IS NULL で入れる。全員に見える必要があるため。
alter table topic_masters enable row level security;
create policy "own or global" on topic_masters for select
  using (user_id = auth.uid() or user_id is null);
create policy "own rows only" on topic_masters for insert
  with check (user_id = auth.uid());

-- ============================================================
-- 確認（2026-08-24 実施済み）
--   select tablename, rowsecurity from pg_tables
--    where schemaname = 'public';          → 6行すべて true
--   select tablename, policyname, cmd from pg_policies
--    where schemaname = 'public';          → 7行
-- ============================================================
