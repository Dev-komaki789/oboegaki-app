-- ============================================================
-- 07_copy_user_data.sql — 既存ユーザーのデータをデモ用ユーザーへ複製する
--
-- 【前提】先に Supabase ダッシュボードでデモ用の Auth ユーザーを作っておく。
--   Authentication → Users → Add user
--     Email    : demokomaki@gmail.com
--     Password : demo123
--     Auto Confirm User : ON   ← 忘れるとログインできない
--   これで on_auth_user_created トリガが public.users にも行を作る。
--
-- 【流し方】Supabase の SQL Editor に全文貼って1回実行する。
--   SQL Editor は RLS を越える権限で動くので、他人の行も読み書きできる。
--   アプリ（anon key）からは 02_rls.sql のポリシーにより絶対にできない操作。
--
-- 【方針】id は引き継がない。コピー先で新しい uuid を振り直し、
--   親子の繋がりだけを対応表（map_*）で付け替える。
--   id をそのまま使うと主キーが衝突するため。
-- ============================================================

begin;

-- ── 0. コピー元／コピー先の user_id を確定する ──────────────
create temp table _u as
select
  (select id from auth.users where email = 'shintarokomaki592@gmail.com') as src,
  (select id from auth.users where email = 'demokomaki@gmail.com')        as dst;

do $$
declare s uuid; d uuid; n int;
begin
  select src, dst into s, d from _u;
  if s is null then
    raise exception 'コピー元 shintarokomaki592@gmail.com が auth.users に見つかりません';
  end if;
  if d is null then
    raise exception 'コピー先 demokomaki@gmail.com が auth.users に見つかりません。先にダッシュボードで作成してください';
  end if;
  -- 二重に流すと同じお客さんが2セット出来てしまうので止める
  select count(*) into n from people where user_id = d;
  if n > 0 then
    raise exception 'コピー先には既に % 件のお客さんがいます。末尾の「やり直し」を実行してから流し直してください', n;
  end if;
end $$;

-- トリガが動いていなかった場合の保険（public.users が無いと外部キー違反になる）
insert into public.users (id, email)
select u.id, u.email from auth.users u, _u where u.id = _u.dst
on conflict (id) do nothing;

-- ── 1. 新しい id の対応表をあらかじめ作る ────────────────────
-- insert ... returning では「元のどの行だったか」が取れないので、
-- 先に uuid を採番して対応表を持っておく。

create temp table map_tm as            -- 話題マスタ（自分で足した分だけ）
select tm.id as old_id, gen_random_uuid() as new_id
from topic_masters tm, _u
where tm.user_id = _u.src;             -- user_id is null の初期マスタ10件は
                                       -- 全員共通なのでコピーしない

create temp table map_people as        -- お客さん
select p.id as old_id, gen_random_uuid() as new_id
from people p, _u
where p.user_id = _u.src;

create temp table map_topics as        -- 人×話題（バブル）
select t.id as old_id, gen_random_uuid() as new_id
from topics t join map_people mp on mp.old_id = t.person_id;

create temp table map_kw as            -- キーワード
select k.id as old_id, gen_random_uuid() as new_id
from keywords k, _u
where k.user_id = _u.src;

-- ── 2. 親から順に挿入する（外部キーの向きに合わせる）──────────

insert into topic_masters (id, user_id, name, sort_order, created_at)
select m.new_id, _u.dst, tm.name, tm.sort_order, tm.created_at
from topic_masters tm join map_tm m on m.old_id = tm.id, _u;

insert into keywords (id, user_id, name, created_at)
select m.new_id, _u.dst, k.name, k.created_at
from keywords k join map_kw m on m.old_id = k.id, _u;

insert into people (id, user_id, name, name_kana, age_group, gender,
                    appearance, company, position, group_id,
                    last_talked_at, created_at)
select m.new_id, _u.dst, p.name, p.name_kana, p.age_group, p.gender,
       p.appearance, p.company, p.position, p.group_id,
       p.last_talked_at, p.created_at
from people p join map_people m on m.old_id = p.id, _u;

-- topic_master_id は「初期マスタ（共通）」ならそのまま、
-- 「自分で足した分」なら複製後の id に差し替える
insert into topics (id, person_id, topic_master_id, score, is_ng,
                    last_talked_at, created_at)
select m.new_id,
       mp.new_id,
       coalesce(mtm.new_id, t.topic_master_id),
       t.score, t.is_ng, t.last_talked_at, t.created_at
from topics t
join map_people mp on mp.old_id = t.person_id
join map_topics m  on m.old_id  = t.id
left join map_tm mtm on mtm.old_id = t.topic_master_id;

-- keyword_id は nullable なので left join
insert into records (id, person_id, topic_id, keyword_id, score,
                     content, talked_at, created_at)
select gen_random_uuid(), mp.new_id, mt.new_id, mk.new_id,
       r.score, r.content, r.talked_at, r.created_at
from records r
join map_people mp on mp.old_id = r.person_id
join map_topics mt on mt.old_id = r.topic_id
left join map_kw  mk on mk.old_id = r.keyword_id;

commit;

-- ============================================================
-- 確認：左右の数が一致すればコピー成功
-- ============================================================
select 'people' as tbl,
       (select count(*) from people
         where user_id = (select id from auth.users where email='shintarokomaki592@gmail.com')) as src,
       (select count(*) from people
         where user_id = (select id from auth.users where email='demokomaki@gmail.com')) as dst
union all
select 'topics',
       (select count(*) from topics t join people p on p.id=t.person_id
         where p.user_id = (select id from auth.users where email='shintarokomaki592@gmail.com')),
       (select count(*) from topics t join people p on p.id=t.person_id
         where p.user_id = (select id from auth.users where email='demokomaki@gmail.com'))
union all
select 'records',
       (select count(*) from records r join people p on p.id=r.person_id
         where p.user_id = (select id from auth.users where email='shintarokomaki592@gmail.com')),
       (select count(*) from records r join people p on p.id=r.person_id
         where p.user_id = (select id from auth.users where email='demokomaki@gmail.com'))
union all
select 'keywords',
       (select count(*) from keywords
         where user_id = (select id from auth.users where email='shintarokomaki592@gmail.com')),
       (select count(*) from keywords
         where user_id = (select id from auth.users where email='demokomaki@gmail.com'));


-- ============================================================
-- 【やり直し】デモ側だけを消して、もう一度流し直したいとき。
-- ★ 消えるのは demokomaki@gmail.com のデータだけ。コピー元は触らない。
--   people を消せば topics → records は on delete cascade で連鎖して消える。
--
--   delete from people
--    where user_id = (select id from auth.users where email='demokomaki@gmail.com');
--   delete from keywords
--    where user_id = (select id from auth.users where email='demokomaki@gmail.com');
--   delete from topic_masters
--    where user_id = (select id from auth.users where email='demokomaki@gmail.com');
-- ============================================================
