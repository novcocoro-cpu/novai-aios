-- ============================================================
-- 改善①: room1.alternatives テーブルは既存（20260318で作成済み）
-- 改善②: room1.market_data テーブルを新規追加
-- ============================================================

-- 金相場などのリアルタイムデータ保存用
create table if not exists room1.market_data (
  key         text primary key,
  value       numeric not null,
  source      text,
  updated_at  timestamptz default now()
);

-- 初期データ
insert into room1.market_data (key, value, source) values
  ('gold_price_jpy', 14820, 'initial'),
  ('usd_jpy', 153.4, 'initial'),
  ('platinum_price_jpy', 5240, 'initial')
on conflict (key) do nothing;

-- 権限（room1スキーマは既に付与済みだがテーブル単位で念のため）
grant all on room1.market_data to anon, authenticated;
