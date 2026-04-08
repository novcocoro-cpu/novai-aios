-- ============================================================
-- 金属メッキ経営支援AI — Supabase 初期セットアップSQL
-- ============================================================

create schema if not exists shared;
create schema if not exists room1;
create schema if not exists room2;
create schema if not exists room3;
create schema if not exists dashboard;

-- shared.settings
create table shared.settings (
  key         text primary key,
  value       text not null,
  updated_at  timestamptz default now()
);

insert into shared.settings values
  ('prompt_strategy', 'あなたは金属メッキ業界専門の経営戦略AIアドバイザーです。金相場分析・代替材料提案・価格戦略を担当します。数字を必ず示し、3つの選択肢と推奨を提示してください。', now()),
  ('prompt_sales', 'あなたは金属メッキ業界の営業コーチAIです。抱き合わせ販売と価値提案を得意とします。提案書は「課題→解決策→数字→行動喚起」の構成で作成してください。', now()),
  ('prompt_tech', 'あなたは金属表面処理の技術調達AIアドバイザーです。Web検索で最新情報を収集し、サプライヤー比較・代替技術・設備導入コストを具体的な数字で提示してください。', now()),
  ('model_strategy', 'gemini-2.5-flash', now()),
  ('model_sales', 'claude-sonnet-4-6', now()),
  ('model_tech', 'gemini-2.5-flash', now()),
  ('temperature', '0.3', now()),
  ('company_name', '田中メッキ工業 株式会社', now()),
  ('company_industry', '金属メッキ加工業', now());

-- room1.conversations
create table room1.conversations (
  id          uuid primary key default gen_random_uuid(),
  title       text,
  messages    jsonb not null default '[]',
  tags        text[] default '{}',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- room1.alternatives
create table room1.alternatives (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  cost_reduction  integer,
  quality_note    text,
  is_recommended  boolean default false,
  sort_order      integer default 0,
  created_at      timestamptz default now()
);

insert into room1.alternatives (name, cost_reduction, quality_note, is_recommended, sort_order) values
  ('PVDコーティング（TiN）', 42, '金メッキと同等の光沢。設備投資 ¥400万〜。', true, 1),
  ('真鍮+金フラッシュ', 35, '装飾用途で金メッキに近い外観。耐久性やや劣る。', false, 2),
  ('金色アルマイト', 61, 'アルミ専用。コスト最安だが適用素材に制限あり。', false, 3),
  ('Ag + 黄色クリアコート', 28, '銀メッキ+クリア塗装の組み合わせ。比較的導入しやすい。', false, 4);

-- room2.conversations
create table room2.conversations (
  id          uuid primary key default gen_random_uuid(),
  title       text,
  messages    jsonb not null default '[]',
  tags        text[] default '{}',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- room3.conversations
create table room3.conversations (
  id              uuid primary key default gen_random_uuid(),
  title           text,
  messages        jsonb not null default '[]',
  search_queries  text[],
  tags            text[] default '{}',
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- dashboard.orders
create table dashboard.orders (
  id              uuid primary key default gen_random_uuid(),
  customer_name   text,
  plating_type    text,
  amount          integer,
  cost            integer,
  profit_loss     integer generated always as (amount - cost) stored,
  status          text default 'pending',
  ordered_at      timestamptz default now(),
  created_at      timestamptz default now()
);

insert into dashboard.orders (customer_name, plating_type, amount, cost, status) values
  ('鈴木自動車工業', '金+亜鉛セット', 5200000, 3900000, 'profit'),
  ('ホンダ部品㈱', '金メッキ単独', 3800000, 4200000, 'loss'),
  ('山田精機', 'ニッケル+クロム', 1400000, 900000, 'profit'),
  ('東海部品㈱', '金メッキ交渉中', 4200000, 4200000, 'pending');

-- 権限付与
grant usage on schema shared    to anon, authenticated;
grant usage on schema room1     to anon, authenticated;
grant usage on schema room2     to anon, authenticated;
grant usage on schema room3     to anon, authenticated;
grant usage on schema dashboard to anon, authenticated;

grant all on all tables in schema shared    to anon, authenticated;
grant all on all tables in schema room1     to anon, authenticated;
grant all on all tables in schema room2     to anon, authenticated;
grant all on all tables in schema room3     to anon, authenticated;
grant all on all tables in schema dashboard to anon, authenticated;
