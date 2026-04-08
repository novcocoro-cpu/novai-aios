-- ============================================================
-- 会社ナレッジベース — shared.knowledge_base
-- ============================================================

create table if not exists shared.knowledge_base (
  id          uuid primary key default gen_random_uuid(),
  category    text not null default 'other',
  title       text not null,
  content     text not null,
  file_name   text,
  file_type   text,
  tags        text[] default '{}',
  is_active   boolean default true,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

grant all on shared.knowledge_base to anon, authenticated;
