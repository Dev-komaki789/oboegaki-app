-- ============================================================
-- 04_seed_sample.sql — サンプルのお客さん6人
--
-- 2026-08-24 に実行して成功したもの。03_seed_master.sql のあとに流す。
-- モックアップ/smartphone/S-02_お客さん一覧.png と同じ顔ぶれ。
--
-- ★ 実行前に下の 'ここに自分のメールアドレス' を書き換えること。
--
--   実行当日は public.users が1行だけだったので
--     (select id from public.users limit 1)
--   でも同じ結果になった。ただし RLS の確認用に2人目のユーザーを作ると
--   limit 1 がどちらを返すか保証されない（order by が無いため）。
--   作り直すときに事故らないよう、メールアドレスで特定する形にしてある。
-- ============================================================

with me as (
  select id from public.users where email = 'ここに自分のメールアドレス'
)
insert into people (user_id, name, name_kana, age_group, gender,
                    appearance, company, position, last_talked_at)
select me.id, v.name, v.name_kana, v.age_group, v.gender,
       v.appearance, v.company, v.position, v.last_talked_at
from me, (values
  -- 同姓同名の2人。例外ではなく標準ケース。appearance で見分ける（§9 S-02）
  ('田中 みか',   'たなか みか',     '30代', '女性', 'ショートボブ、眼鏡、ネイル',
   null::text, null::text, current_date - 3),
  ('田中 みか',   'たなか みか',     '50代', '女性', 'ロングヘア、白いバッグ',
   null, null, current_date - 9),

  -- 会社名・役職が入るのはこの2人だけ。
  -- 空欄の項目は情報タブで行ごと消える（§9 S-04）ことの確認用。
  ('佐藤 健一',   'さとう けんいち', '40代', '男性', '短髪、ひげ',
   '株式会社ミライ工業', '営業部長', current_date - 11),

  ('中村 あゆみ', 'なかむら あゆみ', '20代', '女性', 'インナーカラー（青）',
   null, null, current_date - 15),
  ('渡辺 ゆう',   'わたなべ ゆう',   '60代', '女性', 'ボブ、眼鏡',
   null, null, current_date - 22),

  -- 見た目の特徴3個。一覧のバッジが2行に折り返す側の確認用
  ('山田 大輔',   'やまだ だいすけ', '30代', '男性', '眼鏡、腕時計、革ジャケット',
   'ヤマダ商事', '課長', current_date - 42)
) as v(name, name_kana, age_group, gender,
       appearance, company, position, last_talked_at);

-- ============================================================
-- last_talked_at を current_date - N で入れている理由：
--   固定日にすると「3日前」が明日には「4日前」になり、デモのたびに
--   入れ直すことになる。相対日ならいつ見ても同じ見え方になる。
--
-- 入れ直すとき：
--   delete from people;   -- topics / records も cascade で消える
--   （そのあとこのファイルをもう一度流す）
--
-- 確認（2026-08-24 実施済み）
--   select name, age_group, appearance, company, last_talked_at
--     from people order by last_talked_at desc;   → 6行
-- ============================================================
