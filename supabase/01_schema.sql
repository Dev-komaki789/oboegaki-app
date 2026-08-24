-- ============================================================
-- 01_schema.sql — テーブル定義（引き継ぎ_実装指示書 §4 の DDL）
--
-- 2026-08-24 に Supabase の SQL Editor で実際に実行して成功したもの。
-- 作り直すときは supabase/ の中を 01 → 02 → 03 … の番号順に流す。
-- 順番を入れ替えると、参照先のテーブルが無くて必ず失敗する。
-- ============================================================

create extension if not exists pg_trgm;

-- 利用者。Supabase Auth と 1:1
create table users (
  id         uuid primary key,              -- auth.users.id と同一
  email      text not null,
  created_at timestamptz not null default now()
);

-- お客さん
create table people (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references users(id) on delete cascade,
  name           text not null,             -- 唯一の必須項目
  name_kana      text,
  age_group      text,
  gender         text,
  appearance     text,                      -- 「、」区切りで複数可
  company        text,                      -- 検索対象・サジェスト対象
  position       text,                      -- 表示のみ。検索対象に含めない
  group_id       int default 1,             -- v6で廃止。カラムのみ残す
  last_talked_at date,                      -- 一覧の並び順（意図的な冗長カラム）
  created_at     timestamptz not null default now()
);
create index idx_people_user on people(user_id);
create index idx_people_last on people(user_id, last_talked_at desc);
create index idx_people_search on people using gin (
  (name || ' ' || coalesce(name_kana,'') || ' '
   || coalesce(appearance,'') || ' ' || coalesce(company,'')) gin_trgm_ops);

-- 話題マスタ。user_id が NULL なら初期マスタ（全員に見える）
create table topic_masters (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references users(id) on delete cascade,   -- NULL可
  name       text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create unique index idx_topic_master_uniq
  on topic_masters(coalesce(user_id::text,'global'), name);

-- 人 × 話題（バブル1個）
create table topics (
  id              uuid primary key default gen_random_uuid(),
  person_id       uuid not null references people(id) on delete cascade,
  topic_master_id uuid not null references topic_masters(id) on delete restrict,
  score           numeric(5,2) not null default 0,   -- バブルの大きさ（キャッシュ）
  is_ng           boolean not null default false,
  last_talked_at  date,
  created_at      timestamptz not null default now()
);
create unique index idx_topics_uniq on topics(person_id, topic_master_id);
create index idx_topics_bubble on topics(person_id, is_ng, score desc);

-- キーワードマスタ。利用者単位（全顧客を横断してサジェスト）
create table keywords (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now()
);
create unique index idx_keywords_uniq on keywords(user_id, name);
create index idx_keywords_suggest on keywords(user_id, name text_pattern_ops);

-- ★本体。1回の保存＝1レコード
create table records (
  id         uuid primary key default gen_random_uuid(),
  person_id  uuid not null references people(id)   on delete cascade,
  topic_id   uuid not null references topics(id)   on delete cascade,
  keyword_id uuid          references keywords(id) on delete set null,
  score      smallint not null check (score between 0 and 100),
  content    text,                              -- nullable。空でも保存できる
  talked_at  date not null,                     -- 深夜は前日扱い（午前4時まで）
  created_at timestamptz not null default now()
);
create index idx_records_person   on records(person_id, talked_at desc);
create index idx_records_topic    on records(topic_id, talked_at desc);
create index idx_records_keyword  on records(keyword_id, talked_at desc);
create index idx_records_content  on records(person_id, talked_at desc)
  where content is not null;


-- ============================================================
-- ここから下は §4 に無い追加。2026-08-24 に必要と判明したもの。
--
-- Supabase の認証は auth.users にしか行を作らない。しかし people.user_id が
-- 参照しているのは public.users なので、橋渡ししないと外部キー違反で
-- お客さんを1人も登録できない。
--
-- security definer：作成者（管理者）の権限で動く。アカウント作成の瞬間は
--   まだログインしていないため、RLS を越えて書き込む必要がある。
--   強い権限なので、処理は「1テーブルに1行入れるだけ」に絞ってある。
-- ============================================================

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.users (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
