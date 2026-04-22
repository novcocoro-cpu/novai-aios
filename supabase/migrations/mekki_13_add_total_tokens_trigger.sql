-- mekki_13 — 当初 chat_sessions.total_tokens 用に別トリガー update_session_total_tokens()
-- を追加したが、既存の update_session_message_count() が INSERT 時に
-- total_tokens += NEW.metadata.token_count を既に実行していたため二重加算が発生。
-- mekki_14 でこのマイグレーションで作ったオブジェクトを削除済み。
-- 本ファイルは履歴追跡のため残す（実行しても既に存在しない可能性あり）。

CREATE OR REPLACE FUNCTION mekki_shared.update_session_total_tokens()
RETURNS TRIGGER AS $$
DECLARE
  delta bigint := 0;
BEGIN
  IF TG_OP = 'INSERT' THEN
    delta := COALESCE((NEW.metadata->>'token_count')::bigint, 0);
    IF delta <> 0 THEN
      UPDATE mekki_shared.chat_sessions
      SET total_tokens = COALESCE(total_tokens, 0) + delta
      WHERE id = NEW.session_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    delta := COALESCE((NEW.metadata->>'token_count')::bigint, 0)
           - COALESCE((OLD.metadata->>'token_count')::bigint, 0);
    IF delta <> 0 THEN
      UPDATE mekki_shared.chat_sessions
      SET total_tokens = COALESCE(total_tokens, 0) + delta
      WHERE id = NEW.session_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    delta := COALESCE((OLD.metadata->>'token_count')::bigint, 0);
    IF delta <> 0 THEN
      UPDATE mekki_shared.chat_sessions
      SET total_tokens = GREATEST(COALESCE(total_tokens, 0) - delta, 0)
      WHERE id = OLD.session_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_session_total_tokens ON mekki_shared.chat_messages;
CREATE TRIGGER trg_update_session_total_tokens
AFTER INSERT OR UPDATE OR DELETE ON mekki_shared.chat_messages
FOR EACH ROW EXECUTE FUNCTION mekki_shared.update_session_total_tokens();
