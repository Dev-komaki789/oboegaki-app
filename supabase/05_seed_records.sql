-- ============================================================
-- 05_seed_records.sql — デモ用の会話記録
--
-- 04_seed_sample.sql（お客さん6人）のあとに流す。
-- 何度でも実行できる（先に自分の records / topics / keywords を消す）。
--
-- ★ 意図的に仕込んであること
--   ・食べ物（田中）… 直近の当たり。3件目はキーワードも内容も無い
--                     「10秒で終わる記録」。疑似枠 __none__ で EMA に入る（§7 決着1）
--   ・旅行（田中）  … 200日前。topics.score は 77.5 だが表示値は 62.0 に落ちる。
--                     時間減衰が順位を動かすことの実証（§5 ②）
--   ・仕事（田中）  … is_ng = true。情報タブの赤バナー確認用
--   ・食べ物の45点  … content が null。話題別タブに出ないことの確認用（§9 S-04）
-- ============================================================
do $$
declare
  uid uuid;
  p_tanaka uuid; p_sato uuid;
  tp uuid;
  kw_ramen uuid; kw_kodomo uuid; kw_okinawa uuid; kw_tenshoku uuid; kw_ohtani uuid;
  m_food uuid; m_family uuid; m_trip uuid; m_health uuid; m_work uuid; m_sports uuid;
begin
  select id into uid from public.users limit 1;

  select id into p_tanaka from people
   where user_id = uid and name = '田中 みか' and age_group = '30代';
  select id into p_sato from people
   where user_id = uid and name = '佐藤 健一';

  if p_tanaka is null or p_sato is null then
    raise exception 'サンプルのお客さんが見つかりません。04_seed_sample.sql を先に実行してください。';
  end if;

  delete from records where person_id in (p_tanaka, p_sato);
  delete from topics  where person_id in (p_tanaka, p_sato);
  delete from keywords where user_id = uid;

  select id into m_food   from topic_masters where user_id is null and name = '食べ物';
  select id into m_family from topic_masters where user_id is null and name = '家族';
  select id into m_trip   from topic_masters where user_id is null and name = '旅行・おでかけ';
  select id into m_health from topic_masters where user_id is null and name = '健康・美容';
  select id into m_work   from topic_masters where user_id is null and name = '仕事';
  select id into m_sports from topic_masters where user_id is null and name = 'スポーツ';

  -- キーワードは利用者単位。全顧客を横断してサジェストされる
  insert into keywords (user_id, name) values
    (uid,'ラーメン'),(uid,'お子さん'),(uid,'沖縄'),(uid,'転職'),(uid,'大谷翔平');
  select id into kw_ramen    from keywords where user_id=uid and name='ラーメン';
  select id into kw_kodomo   from keywords where user_id=uid and name='お子さん';
  select id into kw_okinawa  from keywords where user_id=uid and name='沖縄';
  select id into kw_tenshoku from keywords where user_id=uid and name='転職';
  select id into kw_ohtani   from keywords where user_id=uid and name='大谷翔平';

  -- ── 田中みか（30代）───────────────────────────
  insert into topics (person_id, topic_master_id, score, last_talked_at)
  values (p_tanaka, m_food, 71.80, current_date - 3) returning id into tp;
  insert into records (person_id, topic_id, keyword_id, score, content, talked_at) values
    (p_tanaka, tp, kw_ramen, 85, '駅前にできた家系ラーメンが当たりだったと。次は替え玉すると言っていた', current_date - 3),
    (p_tanaka, tp, kw_ramen, 72, '前に話したラーメン屋、こんどは旦那さんと行ったらしい', current_date - 24),
    (p_tanaka, tp, null,     45, null, current_date - 40);

  insert into topics (person_id, topic_master_id, score, last_talked_at)
  values (p_tanaka, m_family, 70.50, current_date - 17) returning id into tp;
  insert into records (person_id, topic_id, keyword_id, score, content, talked_at) values
    (p_tanaka, tp, kw_kodomo, 90, '下のお子さんが小学校に上がったばかり。送り迎えが大変だと', current_date - 17),
    (p_tanaka, tp, kw_kodomo, 60, 'お子さんはサッカーを習い始めたところ', current_date - 45);

  -- ★ 減衰の実証：減衰前 77.5 → 表示値 62.0
  insert into topics (person_id, topic_master_id, score, last_talked_at)
  values (p_tanaka, m_trip, 77.50, current_date - 200) returning id into tp;
  insert into records (person_id, topic_id, keyword_id, score, content, talked_at) values
    (p_tanaka, tp, kw_okinawa, 80, '去年の沖縄がとても良かったと。美ら海水族館の話で盛り上がる', current_date - 200),
    (p_tanaka, tp, kw_okinawa, 75, '沖縄はリピートしたいらしい', current_date - 260);

  insert into topics (person_id, topic_master_id, score, last_talked_at)
  values (p_tanaka, m_health, 55.00, current_date - 10) returning id into tp;
  insert into records (person_id, topic_id, keyword_id, score, content, talked_at) values
    (p_tanaka, tp, null, 55, '最近よく眠れないと言っていた', current_date - 10);

  insert into topics (person_id, topic_master_id, score, is_ng, last_talked_at)
  values (p_tanaka, m_work, 40.00, true, current_date - 400) returning id into tp;
  insert into records (person_id, topic_id, keyword_id, score, content, talked_at) values
    (p_tanaka, tp, kw_tenshoku, 40, '転職の話になって空気が重くなった。以後この話はしない', current_date - 400);

  -- ── 佐藤健一 ─────────────────────────────────
  insert into topics (person_id, topic_master_id, score, last_talked_at)
  values (p_sato, m_sports, 90.00, current_date - 11) returning id into tp;
  insert into records (person_id, topic_id, keyword_id, score, content, talked_at) values
    (p_sato, tp, kw_ohtani, 92, '大谷の話で一番盛り上がった。今季の本塁打を全部覚えている', current_date - 11),
    (p_sato, tp, kw_ohtani, 88, '大谷が好き。開幕戦は有給を取ったらしい', current_date - 90);

  insert into topics (person_id, topic_master_id, score, last_talked_at)
  values (p_sato, m_work, 60.00, current_date - 11) returning id into tp;
  insert into records (person_id, topic_id, keyword_id, score, content, talked_at) values
    (p_sato, tp, kw_tenshoku, 60, '部署が変わって忙しいと', current_date - 11);

  update people set last_talked_at = current_date - 3  where id = p_tanaka;
  update people set last_talked_at = current_date - 11 where id = p_sato;

  raise notice '完了：田中みか5話題・佐藤健一2話題、記録11件を入れました。';
end $$;

-- ============================================================
-- 期待値（lib/score.ts で算出・2026-08 時点で画面と一致を確認）
--
--   田中みか30代 / 食べ物          表示値 71.8 / 減衰前 71.8
--   田中みか30代 / 家族            表示値 70.5 / 減衰前 70.5
--   田中みか30代 / 旅行・おでかけ   表示値 62.0 / 減衰前 77.5  ★減衰
--   田中みか30代 / 健康・美容      表示値 55.0 / 減衰前 55.0
--   田中みか30代 / 仕事（NG）      表示値 26.0 / 減衰前 40.0
--   佐藤健一   / スポーツ          表示値 90.0 / 減衰前 90.0
--   佐藤健一   / 仕事              表示値 60.0 / 減衰前 60.0
-- ============================================================
