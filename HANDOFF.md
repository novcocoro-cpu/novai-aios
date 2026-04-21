# HANDOFF — NOVAI 金属メッキ加工アプリ 作業中断メモ

このドキュメントは作業 PC 移行のためのチェックポイントです。新 PC で作業を再開する人が、これ 1 枚で現状把握・環境復元・作業再開できるよう書かれています。

---

## ⚠️ 2026-04-22 緊急中断メモ（デモ対応のため一時停止）

ユーザー本日クライアント訪問のため一時中断、移動後に再開。新 PC 側では以下まで進行済み。

### 動作している機能（デモ可能）

| エンドポイント | HTTP | メモ |
|---|---|---|
| `/api/orders` | 200 | DB エラー時フォールバックデータ返却 |
| `/api/knowledge` | 200 | 空配列（DB に行なし） |
| `/api/materials` | 200 | **空配列スタブ**（下記 #2 参照） |
| `/api/gold-price` | 200 | Gemini + googleSearch 経由で実価格取得 ✅ |
| `/api/cron/archive-sessions` | 200 | `{"ok":true,"archived":0,"thresholdDays":90}` |
| `/api/cron/update-gold-price` | 200 | `{"ok":true,"price":27299,"source":"gemini"}` — 15 分毎に `mekki_room1.gold_prices` にログ追加 |
| `/api/settings` GET/POST | 200 | `mekki_shared.app_settings` 経由、`DEFAULT_PROMPTS` をデフォルト値として merge |
| 画面 UI ナビゲーション全般 | — | Next.js dev 起動 (Turbopack, http://localhost:3000) |

### 移動後に必ず対応する未解決事項

1. ~~**`/api/gold-price`**: Gemini googleSearch が動かず fallback 値返却。~~ **解決済み（2026-04-22）**
   - 環境変数名を `GEMINI_API_KEY` → `GOOGLE_GENERATIVE_AI_API_KEY` に統一したことで動作開始。
   - 実測: `{"price":27132,"source":"gemini"}` 等を返却、Gemini 2.5 + googleSearch 経由で金価格取得中。
   - 先の「fallback に落ちていた」観測は transient な Turbopack/モジュール初期化タイミングが原因と推定。

2. **`/api/materials`**: DB の `mekki_room1.alternative_materials` テーブルと UI が期待するカラムが完全に別設計。
   - DB 実体: `id, user_id, session_id, material_name, properties, cost_comparison, use_cases, source_urls, ai_summary, notes, created_at, updated_at`
   - UI 期待: `name, cost_reduction, is_recommended, sort_order`
   - 参照箇所: `src/components/screens/Settings.tsx`, `src/components/panels/TechPanel.tsx`, `src/components/panels/StrategyPanel.tsx`
   - 現状は GET で空配列返却のスタブ化（コミット `06777da`）

   **再設計 3 案（次回要決定）**:
   - **A（推奨）**: `Settings > 材料マスタ管理` タブを廃止。代わりに Room 1 側に「この会話で出た AI 生成代替材料提案一覧」パネルを新設。DB の新設計（session_id / ai_summary / source_urls）は AI が session 単位で生成する代替材料候補を格納する意図と解釈
   - **B**: 新テーブル `mekki_room1.material_masters`（または `mekki_shared`）を migration 追加して UI を向かせる。§5 の番号ルール `mekki_13_` から採番必須
   - **C**: PostgreSQL View で列マッピング。ただし `is_recommended` に対応する DB カラムなし、部分実装となる

3. ~~**Phase 2 (settings 書き直し) 未着手**~~ **完了（2026-04-22 コミット `c2324a6`）**
   - `mekki_shared.app_settings` 経由で動作確認済み（POST で temperature 書換 → GET で反映を確認）
   - 旧 `isSupabaseConfigured` 分岐と `DEFAULT_PROMPTS` 書換は dead code として削除

4. **Phase 3 (chat 3 本: strategy/sales/tech) 未着手**
   - 着手前に UI 設計確認必須：session_id のフロント ↔ API 授受方法、UI 修正範囲
   - 現状 AI 呼び出しは全メッセージ履歴送信（料金爆発リスク）→ `getContextForAI()` 必須化が目的

   **既存コード調査結果**: `src/hooks/useChat.ts` は既に `conversationId` を保持・伝達する実装。初期化時に `/api/conversations?room={room}` から最新会話取得、各 POST で `{ messages, conversationId }` 送信、レスポンスの `conversationId` で更新。Phase 3 ではこの仕組みを活かせる。

   **次回着手時の推奨順序**:
   1. `/api/conversations/route.ts` の実装を読み、`conversationId` が `mekki_shared.chat_sessions.id` を指しているか、独自 ID かを確認
   2. `useChat` の POST body を `{ content, sessionId }` に変更（履歴は UI 表示用のみ保持、サーバー送信は停止）
   3. `/api/chat/strategy|sales|tech` を書き直し: `createSession`（無ければ）→ `saveMessage(user)` → `getContextForAI(sessionId)` → AI 呼び出し → `saveMessage(assistant)` → `{content, sessionId}` 返却
   4. 初期セッション解決用 `/api/chat/{room}/init` エンドポイント追加（`listActiveSessions` 経由）

### 2026-04-22 完了コミット一覧

| Commit | 内容 |
|---|---|
| `88f393b` | Phase 1: 5 API routes → new supabase helper（gold-price, materials, knowledge, knowledge/upload, orders） |
| `06777da` | env 変数名統一 (`GEMINI_API_KEY` → `GOOGLE_GENERATIVE_AI_API_KEY`) + `knowledge_base.is_active` フィルタ削除 + `/api/materials` 空配列スタブ化 |
| `08f8ede` | `/api/gold-price` 解決ステータスを HANDOFF に反映 |
| `c2324a6` | Phase 2: `/api/settings` → `mekki_shared.app_settings`（`getSetting`/`setSetting` 経由） |
| `42778e1` | `/api/cron/update-gold-price` 追加（15 分スケジュール）+ `mekki_room1.gold_prices` へ append、`/api/gold-price` は cache-first に再編。共有 helper `src/lib/gold-price.ts` を追加 |

---

## Section 1: プロジェクト概要

- **アプリ名**：NOVAI — 金属メッキ加工会社向け AI アシスタント
- **対象ユーザー**：田中メッキ工業 株式会社（mekki_shared.companies に seed 済み）
- **技術スタック**：Next.js 16 / React 19 / Vercel / Supabase (Postgres + Storage) / Google Gemini / Anthropic Claude
- **Vercel デプロイ URL**：https://novai-metal-os.vercel.app/
- **GitHub リポジトリ**：https://github.com/novcocoro-cpu/novai-aios.git（branch: `master`）
- ⚠️ **注意**：Vercel プロジェクト名 `novai-metal-os` と GitHub リポジトリ名 `novai-aios` は異なります。検索時に混同しないこと。

---

## Section 2: 技術的な進捗状況

### ✅ 完了

- **§2 Supabase クライアント設定**
  - `src/lib/supabase/server.ts` — `createServerClient(schema)` service role 用、`mekki_*` スキーマ切替
  - `src/lib/supabase/client.ts` — `createBrowserSupabase()` ブラウザ側 anon 用（`@supabase/ssr`）
  - `src/lib/supabase/types.ts` — `Room` / `SessionStatus` / `MessageRole` / `ChatSession` / `ChatMessage`
- **§3 ユーザー連携方針**（パターン B：固定ユーザー運用、ログイン画面なし）
  - `process.env.DEFAULT_USER_ID` と `process.env.DEFAULT_COMPANY_ID` を全 DB 操作で使う
  - seed 行は `mekki_shared.users` / `mekki_shared.companies` に既に存在
  - コード追加は不要（API Route 冒頭で env を読むだけ）
- **§4 セッション管理の中核 helper**
  - `src/lib/chat/sessions.ts` — `createSession`, `completeSession`, `getSession`, `listActiveSessions`
  - `src/lib/chat/messages.ts` — `saveMessage`（token_count を metadata に記録）
  - `src/lib/chat/context.ts` — `getContextForAI(sessionId)` **スライディングウィンドウ必須経路**（既定 20 件）
  - ⚠️ AI を呼ぶ直前には必ずこの関数を通すこと。全メッセージ送信は料金爆発のため禁止。
- **§4-5 自動アーカイブ Cron**
  - `src/app/api/cron/archive-sessions/route.ts` — `Authorization: Bearer $CRON_SECRET` 必須
  - `vercel.json` — 毎日 03:00 UTC 起動
- **§8-4 / §8-5 / §8-6 基盤 helper**
  - `src/lib/settings.ts` — `getSetting<T>` / `setSetting`（`app_settings` テーブル、`user_id, setting_key` unique）
  - `src/lib/prompts.ts` — `getActivePrompt(roomNumber)`（`prompt_templates` から is_active=true を取得）
  - `src/lib/activity.ts` — `logActivity(input)` → `mekki_dashboard.activity_logs`
- **環境整備**
  - `.env.local` 作成、非機密値（URL / DEFAULT_USER_ID / DEFAULT_COMPANY_ID）記入済み。機密 3 値は空欄
  - `.env.local.example` 作成（値全て空のテンプレ）
  - `.gitignore` の `.env*` パターンで両方除外。git に上がっていないこと確認済み
  - `@supabase/ssr` を `package.json` に追加インストール済み
- **型チェック**：`npx tsc --noEmit` 通過

### ⏳ 未着手

- **旧 API Route 10 本の書き直し**（最重要）
  - 対象：`src/app/api/{chat/{strategy,sales,tech},conversations,generate/proposal,gold-price,knowledge,knowledge/upload,materials,orders,settings,upload}/route.ts`
  - 現状：全て `@/lib/supabase-server` の `supabaseSchema("shared")` を呼んでいるが、旧スキーマ（`shared`/`room1` 等）は DB に存在せず実行時 500。TypeScript はコンパイルだけ通る。
  - 新 helper（`@/lib/supabase/server`, `@/lib/chat/*`）経由に置換する必要あり。ユーザーの方針決定（Section 3）を受けてから着手。
- **§4-4 要約処理** `maybeTriggerSummarization`
  - 指示書 §11 優先度で「運用が始まってからでOK」と最低順位
  - Gemini light model 呼び出しが必要。Section 3 の方針決定後、実装判断。
- **§5 Room 1 成果物**：`gold_prices`（Cron で 15 分毎 Gemini Web Search 更新）、`price_simulations`、`alternative_materials`
- **§6 Room 2 成果物**：`proposals`、`talk_scripts`、`bundle_strategies`
- **§7 Room 3 成果物**：`suppliers`、`supplier_comparisons`、`technical_research`
- **§8 共通機能残り**：
  - §8-1 ファイルアップロード（Storage + `uploaded_files` テーブル + PDF/Word/Excel/CSV 抽出）
  - §8-2 カスタムタグ（`tags` テーブル）
  - §8-3 ナレッジベース + チャットからの格上げ機能
- **§9 ダッシュボード**：`metrics_cache` と `activity_logs` 集計、最新金価格表示、`reports` 生成
- **UI コンポーネント**（`src/components/*`）：旧 API Route に依存するため、API 書き直しに合わせて順次検証が必要。破損状況は未調査。

---

## Section 3: 中断時点で未決定の方針（新 PC で要決定）

§4 完了後の進め方について 3 択が提示されています：

- **α**：`.env.local` 秘密鍵記入 → `npm run dev` 起動 → cron エンドポイントに手動 curl で疎通確認 → その後 API Route 書き直し
- **β**：先に旧 API Route 10 本を新 helper 経由に書き直し、UI 復活を確認しながら破損 UI 箇所を特定
- **γ**：§5-§7 の Room 成果物 CRUD helper を先に積み上げ、UI / API 書き直しは後回し

**Claude Code の推奨：α → β**
- α で基盤（env / Supabase 接続 / スライディングウィンドウ）の健全性を先に確認
- β で UI 復旧作業。機械的な書き換え中心で進められる
- γ は UI の土台が立ってから着手した方が結合コストが低い

新 PC 再開時、最初に Claude Code に「α / β / γ のどれで進めるか」をユーザーに尋ねてもらってください。

---

## Section 4: 環境変数

`.env.local` をリポジトリルートに配置（ファイル自体は `.gitignore` で除外、新 PC で再作成）。

| 変数名 | 取得方法 | 備考 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | 固定値 `https://vckaqngsxgjpxduixpol.supabase.co` | 既知 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase ダッシュボード → Settings → API → anon public | **再取得** |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase ダッシュボード → Settings → API → service_role | **再取得・機密** |
| `DEFAULT_USER_ID` | 固定値 `322f4600-d764-4e63-8926-e4fdfd0d6463` | 既知（seed 行の id） |
| `DEFAULT_COMPANY_ID` | 固定値 `6062510a-673a-4a15-abff-03f1e025725a` | 既知（seed 行の id） |
| `CRON_SECRET` | 新 PC で 48 文字ランダム生成 | PowerShell 1 行可 |
| `ANTHROPIC_API_KEY` | Anthropic コンソールから取得 | 既存の `src/lib/claude.ts` で使用 |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Google AI Studio から取得 | 既存の `src/lib/gemini.ts` で使用 |

`CRON_SECRET` の PowerShell 生成コマンド：
```
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 48 | % {[char]$_})
```

**⚠️ `.env.local` は絶対に git に commit しないこと**。`.gitignore` の `.env*` パターンで除外されていることを確認してから作業開始。

---

## Section 5: Supabase ダッシュボード側の未完了作業

本 PC では未完了のため、新 PC で実施（またはユーザーがブラウザで完了させる）：

- [ ] **Exposed schemas に追加**：Settings → API → Exposed schemas に以下 5 つを追加（カンマ区切り）
  - `mekki_shared, mekki_room1, mekki_room2, mekki_room3, mekki_dashboard`
  - 未追加だと PostgREST が 404 を返すので、§4 の DB 呼び出しは全滅します。
- [ ] **Storage バケット `mekki-uploads` 作成**：
  - Name: `mekki-uploads`
  - Public: **OFF**（非公開）
  - File size limit: 20 MB
  - Allowed MIME types: `application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv,text/plain`
  - 未作成だと §8-1 ファイルアップロードが動きません。
- [ ] **anon key / service_role key の取得**：Settings → API → Project API keys

### Supabase プロジェクト情報

- プロジェクト名：**novcocoro-cpu's Project**
- Project ID：`vckaqngsxgjpxduixpol`
- リージョン：`ap-northeast-1`（東京）
- DB マイグレーション：`mekki_01〜mekki_12` の 12 本適用済み。追加時は `mekki_13_` から番号を振る（**既存マイグレーションの上書き・再実行は厳禁**）
- **現存するスキーマ**：`mekki_shared, mekki_room1, mekki_room2, mekki_room3, mekki_dashboard` のみ。旧 `shared`/`room1`/... は存在しない
- **触ってはいけないスキーマ**：`shacho`, `shacho_os`, `public` — 他アプリのデータ

---

## Section 6: 新 PC での作業再開手順

1. **Node.js LTS をインストール**（https://nodejs.org から LTS 版をダウンロード）。本 PC では v24.13.0 を使用していたが、LTS（v20 系以降）でも動作見込み。
2. **Git をインストール**（https://git-scm.com から）。
3. **作業フォルダを決める**
   - ⚠️ **OneDrive / iCloud Drive 配下は絶対に避けること**（node_modules と同期処理が競合し遅延・破損の原因）
   - 推奨：`C:\Users\<ユーザー名>\novai-metal-os` または `C:\dev\novai-metal-os` など、同期対象外の場所
4. **ターミナル（PowerShell または Git Bash）で以下を実行**：
   ```
   git clone https://github.com/novcocoro-cpu/novai-aios.git novai-metal-os
   cd novai-metal-os
   npm install
   ```
5. **`.env.local` をルートに新規作成**し、Section 4 の 8 変数を記入。
   - 雛形：`.env.local.example` はこのリポジトリでは `.gitignore` で除外されているため、Section 4 の表を見ながら手で書き起こす。
6. **Supabase ダッシュボード（Section 5）の未完了作業を完了させる**：
   - Exposed schemas 追加
   - Storage バケット作成
   - anon / service_role key 取得 → `.env.local` に記入
7. **`npm run dev`** で起動確認（http://localhost:3000）
8. **Claude Code を起動し、最初に以下を送る**：

```
このリポジトリは金属メッキ加工アプリで、作業中断からの再開です。
HANDOFF.md を読んで現状を把握し、Section 3 の α/β/γ 選択肢について
ユーザーに方針確認してから次に進んでください。
指示書「クロコ向け指示書_Supabase統合.md」も参照してください。
```

---

## Section 7: 参考ドキュメント

- `HANDOFF.md`（本文書、新 PC 再開時の最初の参照先）
- **指示書原本**：`クロコ向け指示書_Supabase統合.md` — **本リポジトリには配置されていない**。ユーザーが別途共有（Notion / Google Drive / チャット履歴等）。中断前の会話履歴を引き継ぐか、原本を repo に追加すること。

---

## Section 8: 絶対厳守

- **新 Supabase プロジェクトを作らない**。既存プロジェクト `vckaqngsxgjpxduixpol` のみを使用すること。
- **`shacho` / `shacho_os` / `public` スキーマに一切触らない**。他アプリのデータ。
- **`SUPABASE_SERVICE_ROLE_KEY` を GitHub にコミットしない**。クライアント側（`NEXT_PUBLIC_` 接頭辞）に出さない。
- **`.env.local` が `.gitignore` に含まれているか作業開始時に確認**（`.env*` パターンで含まれているはず）。
- **RLS を無効化しない**。バイパスしたい処理は service_role でサーバーサイドから実行する。
- **AI 呼び出しに全メッセージを送らない**。必ず `src/lib/chat/context.ts` の `getContextForAI()` を経由する。
- **既存の DB マイグレーション（`mekki_01〜mekki_12`）を上書き・再実行しない**。追加は `mekki_13_` から。
- **チャット履歴を物理削除する処理を勝手に追加しない**。`retention_days` / `auto_archive_completed_days` 設定経由のみ許可。
