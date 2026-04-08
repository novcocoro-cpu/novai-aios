-- NOVAI AIOS — Supabase DB Schema
-- SupabaseダッシュボードのSQL Editorで実行すること

-- 1. companies
CREATE TABLE companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'member')),
  department TEXT DEFAULT '',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. daily_reports
CREATE TABLE daily_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  content TEXT NOT NULL,
  sentiment_score INT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. meetings
CREATE TABLE meetings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  transcript TEXT,
  summary TEXT,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. deals
CREATE TABLE deals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  amount INT DEFAULT 0,
  stage TEXT NOT NULL CHECK (stage IN ('initial', 'hearing', 'proposal', 'closing', 'won', 'lost')),
  deadline DATE,
  stagnant_days INT DEFAULT 0,
  ai_next_action TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. scores
CREATE TABLE scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  period DATE NOT NULL,
  total_score INT DEFAULT 0,
  sales_score INT DEFAULT 0,
  mental_score INT DEFAULT 0,
  growth_score INT DEFAULT 0,
  contribution_score INT DEFAULT 0,
  ai_comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. actions
CREATE TABLE actions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. ideas
CREATE TABLE ideas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  is_anonymous BOOLEAN DEFAULT false,
  category TEXT DEFAULT 'other' CHECK (category IN ('sales', 'env', 'cost', 'recruit', 'other')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  ai_score INT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'adopted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. alerts
CREATE TABLE alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('turnover_risk', 'loss', 'opportunity', 'general')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. ai_reports
CREATE TABLE ai_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  report_type TEXT NOT NULL CHECK (report_type IN ('weekly', 'monthly', 'deal', 'member')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ========================================
-- Row Level Security (RLS)
-- ========================================

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_reports ENABLE ROW LEVEL SECURITY;

-- Profiles: ユーザーは自分の会社のメンバーのみ閲覧可
CREATE POLICY "Users can view own company profiles"
  ON profiles FOR SELECT
  USING (
    company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

-- Scores: admin/managerは全社員、memberは自分のみ
CREATE POLICY "Admin/manager can view all scores"
  ON scores FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.company_id = (SELECT company_id FROM profiles WHERE id = scores.profile_id)
        AND profiles.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Members can view own scores"
  ON scores FOR SELECT
  USING (profile_id = auth.uid());

-- Deals: 同じ会社のメンバーのみ閲覧可
CREATE POLICY "Company members can view deals"
  ON deals FOR SELECT
  USING (
    company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

-- Ideas: 同じ会社のメンバーのみ閲覧・投稿可
CREATE POLICY "Company members can view ideas"
  ON ideas FOR SELECT
  USING (
    company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Company members can insert ideas"
  ON ideas FOR INSERT
  WITH CHECK (
    company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

-- Actions: 同じ会社のメンバーのみ
CREATE POLICY "Company members can view actions"
  ON actions FOR SELECT
  USING (
    company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

-- Alerts: admin/managerのみ
CREATE POLICY "Admin/manager can view alerts"
  ON alerts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.company_id = alerts.company_id
        AND profiles.role IN ('admin', 'manager')
    )
  );

-- Daily Reports: メンタルケア用 — memberは自分のみ、admin/managerは全員
CREATE POLICY "Members can view own reports"
  ON daily_reports FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "Admin/manager can view all reports"
  ON daily_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.company_id = daily_reports.company_id
        AND profiles.role IN ('admin', 'manager')
    )
  );

-- AI Reports: admin/managerのみ
CREATE POLICY "Admin/manager can view ai_reports"
  ON ai_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.company_id = ai_reports.company_id
        AND profiles.role IN ('admin', 'manager')
    )
  );

-- Meetings: 同じ会社のメンバー
CREATE POLICY "Company members can view meetings"
  ON meetings FOR SELECT
  USING (
    company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

-- Companies: 自分の会社のみ
CREATE POLICY "Users can view own company"
  ON companies FOR SELECT
  USING (
    id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  );
