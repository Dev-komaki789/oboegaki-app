-- ============================================================
-- 06_seed_sample_people.sql — デモ用「サンプル太郎」「サンプル花子」
--
-- 05_seed_records.sql のあとに流す。
-- ★ 05 は `delete from keywords where user_id = uid;` を含むので、
--   05 → 06 の順を守ること。逆に流すとキーワードが消え、
--   records.keyword_id が NULL になる（on delete set null）。
--
-- 何度でも実行できる（先にこの2人を消してから入れ直す）。
--
-- 内容は特別な趣味に寄せず、どの業種の顧客にも当てはまる範囲にしてある。
-- 話題は初期マスタ10件のうち8件ずつを使い、1人あたり記録15件。
-- バブルが8個並び、大きさの差も出る量。
-- ============================================================
do $$
declare
  uid uuid;
  p_taro uuid; p_hanako uuid;
  tp uuid;
  m_family uuid; m_food uuid; m_life uuid; m_work uuid; m_trip uuid;
  m_health uuid; m_hobby uuid; m_ent uuid; m_pet uuid; m_sports uuid;
begin
  select id into uid from public.users limit 1;
  if uid is null then
    raise exception 'public.users が空です。先にアカウントを作ってください。';
  end if;

  -- 作り直せるように、いったん消す（topics / records は cascade で落ちる）
  delete from people where user_id = uid and name in ('サンプル 太郎', 'サンプル 花子');

  -- ── 話題マスタ ──────────────────────────────
  select id into m_family from topic_masters where user_id is null and name = '家族';
  select id into m_food   from topic_masters where user_id is null and name = '食べ物';
  select id into m_life   from topic_masters where user_id is null and name = '暮らし';
  select id into m_work   from topic_masters where user_id is null and name = '仕事';
  select id into m_trip   from topic_masters where user_id is null and name = '旅行・おでかけ';
  select id into m_health from topic_masters where user_id is null and name = '健康・美容';
  select id into m_hobby  from topic_masters where user_id is null and name = '趣味';
  select id into m_ent    from topic_masters where user_id is null and name = 'エンタメ';
  select id into m_pet    from topic_masters where user_id is null and name = 'ペット';
  select id into m_sports from topic_masters where user_id is null and name = 'スポーツ';

  -- ── キーワード（利用者単位・全顧客を横断してサジェストされる）──
  insert into keywords (user_id, name) values
    (uid,'野球'),(uid,'ジム'),(uid,'お子さん'),(uid,'ご両親'),(uid,'ラーメン'),
    (uid,'お酒'),(uid,'温泉'),(uid,'カメラ'),(uid,'異動'),(uid,'繁忙期'),
    (uid,'通勤'),(uid,'家'),(uid,'睡眠'),(uid,'カフェ'),(uid,'お菓子'),
    (uid,'ディズニー'),(uid,'沖縄'),(uid,'猫'),(uid,'ヨガ'),(uid,'肌荒れ'),
    (uid,'ドラマ'),(uid,'音楽'),(uid,'読書'),(uid,'引っ越し')
  on conflict (user_id, name) do nothing;

  -- ── お客さん2人 ─────────────────────────────
  insert into people (user_id, name, name_kana, age_group, gender,
                      appearance, company, position, last_talked_at)
  values
    (uid, 'サンプル 太郎', 'さんぷる たろう', '40代', '男性',
     '短髪、眼鏡', '株式会社みどり物産', '課長', current_date - 5),
    (uid, 'サンプル 花子', 'さんぷる はなこ', '30代', '女性',
     'ロングヘア、ネイル', null, null, current_date - 3);

  select id into p_taro   from people where user_id = uid and name = 'サンプル 太郎';
  select id into p_hanako from people where user_id = uid and name = 'サンプル 花子';

  -- ══════════ サンプル太郎（8話題・記録15件）══════════

  -- スポーツ 表示81
  insert into topics (person_id, topic_master_id, score, last_talked_at)
  values (p_taro, m_sports, 80.64, current_date - 5) returning id into tp;
  insert into records (person_id, topic_id, keyword_id, score, content, talked_at) values
    (p_taro, tp, (select id from keywords where user_id=uid and name='野球'), 88,
     '応援している球団が今シーズン好調だと。順位表を毎日見ているらしい', current_date - 5),
    (p_taro, tp, (select id from keywords where user_id=uid and name='野球'), 85,
     '週末に球場へ観戦に行ったそう。生で見るとやっぱり違うと', current_date - 33),
    (p_taro, tp, (select id from keywords where user_id=uid and name='ジム'), 50,
     '運動不足が気になってジムに通い始めたところ', current_date - 70);

  -- 家族 表示75
  insert into topics (person_id, topic_master_id, score, last_talked_at)
  values (p_taro, m_family, 74.75, current_date - 19) returning id into tp;
  insert into records (person_id, topic_id, keyword_id, score, content, talked_at) values
    (p_taro, tp, (select id from keywords where user_id=uid and name='お子さん'), 80,
     '息子さんが中学に上がって野球部に入ったそう。道具を揃えるのが大変だと', current_date - 19),
    (p_taro, tp, (select id from keywords where user_id=uid and name='ご両親'), 45,
     '連休に実家へ顔を出してきたと', current_date - 60);

  -- 食べ物 表示74
  insert into topics (person_id, topic_master_id, score, last_talked_at)
  values (p_taro, m_food, 73.50, current_date - 12) returning id into tp;
  insert into records (person_id, topic_id, keyword_id, score, content, talked_at) values
    (p_taro, tp, (select id from keywords where user_id=uid and name='ラーメン'), 75,
     '会社の近くに新しいラーメン屋ができて、昼によく行くと', current_date - 12),
    (p_taro, tp, (select id from keywords where user_id=uid and name='お酒'), 65,
     '金曜は同僚と軽く一杯やるのが習慣らしい', current_date - 47);

  -- 旅行・おでかけ 表示72
  insert into topics (person_id, topic_master_id, score, last_talked_at)
  values (p_taro, m_trip, 72.00, current_date - 26) returning id into tp;
  insert into records (person_id, topic_id, keyword_id, score, content, talked_at) values
    (p_taro, tp, (select id from keywords where user_id=uid and name='温泉'), 72,
     '家族で温泉に一泊してきたそう。露天風呂が良かったと', current_date - 26);

  -- 趣味 表示68
  insert into topics (person_id, topic_master_id, score, last_talked_at)
  values (p_taro, m_hobby, 68.00, current_date - 54) returning id into tp;
  insert into records (person_id, topic_id, keyword_id, score, content, talked_at) values
    (p_taro, tp, (select id from keywords where user_id=uid and name='カメラ'), 68,
     '休みの日にカメラを持って出かけるのが好きだと', current_date - 54);

  -- 仕事 表示64
  insert into topics (person_id, topic_master_id, score, last_talked_at)
  values (p_taro, m_work, 63.50, current_date - 5) returning id into tp;
  insert into records (person_id, topic_id, keyword_id, score, content, talked_at) values
    (p_taro, tp, (select id from keywords where user_id=uid and name='異動'), 70,
     '春の異動で部署が変わって、ようやく慣れてきたと', current_date - 5),
    (p_taro, tp, (select id from keywords where user_id=uid and name='繁忙期'), 55,
     '年度末は残業が続いて大変だったらしい', current_date - 40),
    (p_taro, tp, (select id from keywords where user_id=uid and name='異動'), 60,
     '異動の話が出ているとのこと', current_date - 95);

  -- 暮らし 表示47
  insert into topics (person_id, topic_master_id, score, last_talked_at)
  values (p_taro, m_life, 46.80, current_date - 12) returning id into tp;
  insert into records (person_id, topic_id, keyword_id, score, content, talked_at) values
    (p_taro, tp, (select id from keywords where user_id=uid and name='通勤'), 40,
     '通勤に片道1時間かかるので、電車で本を読んでいると', current_date - 12),
    (p_taro, tp, (select id from keywords where user_id=uid and name='家'), 48,
     'そろそろ家の外壁を塗り直したいと言っていた', current_date - 80);

  -- 健康・美容 表示42
  insert into topics (person_id, topic_master_id, score, last_talked_at)
  values (p_taro, m_health, 42.00, current_date - 33) returning id into tp;
  insert into records (person_id, topic_id, keyword_id, score, content, talked_at) values
    (p_taro, tp, (select id from keywords where user_id=uid and name='睡眠'), 42,
     '寝つきが悪い日が続いているらしい', current_date - 33);

  -- ══════════ サンプル花子（8話題・記録15件）══════════

  -- 旅行・おでかけ 表示82
  insert into topics (person_id, topic_master_id, score, last_talked_at)
  values (p_hanako, m_trip, 82.45, current_date - 17) returning id into tp;
  insert into records (person_id, topic_id, keyword_id, score, content, talked_at) values
    (p_hanako, tp, (select id from keywords where user_id=uid and name='ディズニー'), 85,
     '春休みに家族でディズニーへ。写真を見せてくれた', current_date - 17),
    (p_hanako, tp, (select id from keywords where user_id=uid and name='沖縄'), 68,
     'いつか沖縄に行ってみたいと言っていた', current_date - 90);

  -- ペット 表示80
  insert into topics (person_id, topic_master_id, score, last_talked_at)
  values (p_hanako, m_pet, 80.00, current_date - 24) returning id into tp;
  insert into records (person_id, topic_id, keyword_id, score, content, talked_at) values
    (p_hanako, tp, (select id from keywords where user_id=uid and name='猫'), 80,
     '飼っている猫の話。名前はモモちゃんで、今年で3歳だそう', current_date - 24);

  -- 家族 表示78
  insert into topics (person_id, topic_master_id, score, last_talked_at)
  values (p_hanako, m_family, 78.12, current_date - 3) returning id into tp;
  insert into records (person_id, topic_id, keyword_id, score, content, talked_at) values
    (p_hanako, tp, (select id from keywords where user_id=uid and name='お子さん'), 90,
     '上のお子さんが小学校に入学。毎朝の準備でばたばたしていると', current_date - 3),
    (p_hanako, tp, (select id from keywords where user_id=uid and name='お子さん'), 78,
     '運動会の練習が始まって、帰ってくると疲れているらしい', current_date - 31),
    (p_hanako, tp, (select id from keywords where user_id=uid and name='ご両親'), 55,
     '実家のお母さんがときどき手伝いに来てくれるそう', current_date - 66);

  -- 食べ物 表示72
  insert into topics (person_id, topic_master_id, score, last_talked_at)
  values (p_hanako, m_food, 72.07, current_date - 3) returning id into tp;
  insert into records (person_id, topic_id, keyword_id, score, content, talked_at) values
    (p_hanako, tp, (select id from keywords where user_id=uid and name='カフェ'), 82,
     '駅前にできたカフェのパンケーキが good だったと', current_date - 3),
    (p_hanako, tp, (select id from keywords where user_id=uid and name='カフェ'), 70,
     '休みの日はカフェ巡りをするのが好きらしい', current_date - 24),
    (p_hanako, tp, (select id from keywords where user_id=uid and name='お菓子'), 60,
     'お子さんと一緒にクッキーを焼いたそう', current_date - 58);

  -- 健康・美容 表示71
  insert into topics (person_id, topic_master_id, score, last_talked_at)
  values (p_hanako, m_health, 70.60, current_date - 10) returning id into tp;
  insert into records (person_id, topic_id, keyword_id, score, content, talked_at) values
    (p_hanako, tp, (select id from keywords where user_id=uid and name='ヨガ'), 76,
     '週に1回ヨガに通い始めて、体が軽くなったと', current_date - 10),
    (p_hanako, tp, (select id from keywords where user_id=uid and name='肌荒れ'), 40,
     '季節の変わり目は肌が荒れやすいらしい', current_date - 45);

  -- エンタメ 表示70
  insert into topics (person_id, topic_master_id, score, last_talked_at)
  values (p_hanako, m_ent, 69.90, current_date - 10) returning id into tp;
  insert into records (person_id, topic_id, keyword_id, score, content, talked_at) values
    (p_hanako, tp, (select id from keywords where user_id=uid and name='ドラマ'), 72,
     'いま見ている連続ドラマを毎週楽しみにしているそう', current_date - 10),
    (p_hanako, tp, (select id from keywords where user_id=uid and name='音楽'), 58,
     '好きなアーティストのライブに行ってきたと', current_date - 38);

  -- 趣味 表示62
  insert into topics (person_id, topic_master_id, score, last_talked_at)
  values (p_hanako, m_hobby, 62.00, current_date - 38) returning id into tp;
  insert into records (person_id, topic_id, keyword_id, score, content, talked_at) values
    (p_hanako, tp, (select id from keywords where user_id=uid and name='読書'), 62,
     '寝る前に少しずつ本を読むのが習慣だと', current_date - 38);

  -- 暮らし 表示50
  insert into topics (person_id, topic_master_id, score, last_talked_at)
  values (p_hanako, m_life, 50.00, current_date - 52) returning id into tp;
  insert into records (person_id, topic_id, keyword_id, score, content, talked_at) values
    (p_hanako, tp, (select id from keywords where user_id=uid and name='引っ越し'), 50,
     '来年あたり引っ越しを考えていると', current_date - 52);

  raise notice '完了：サンプル太郎・サンプル花子（各8話題・記録15件）を入れました。';
end $$;

-- ============================================================
-- 期待値（lib/score.ts で算出）
--
-- サンプル太郎（最終来店 5日前）
--   スポーツ       81 / 家族 75 / 食べ物 74 / 旅行・おでかけ 72
--   趣味           68 / 仕事 64 / 暮らし 47 / 健康・美容 42
--
-- サンプル花子（最終来店 3日前）
--   旅行・おでかけ 82 / ペット 80 / 家族 78 / 食べ物 72
--   健康・美容     71 / エンタメ 70 / 趣味 62 / 暮らし 50
--
-- 確認:
--   select p.name, tm.name as 話題, t.score, t.last_talked_at
--     from topics t join people p on p.id = t.person_id
--     join topic_masters tm on tm.id = t.topic_master_id
--    where p.name like 'サンプル%' order by p.name, t.score desc;
-- ============================================================
