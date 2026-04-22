-- mekki_13 で追加したトリガー/関数は既存の update_session_message_count と
-- total_tokens 更新が重複していた（二重加算）。mekki_13 の追加オブジェクトを削除し、
-- 既存 trg_update_session_message_count 一本に戻す。

DROP TRIGGER IF EXISTS trg_update_session_total_tokens ON mekki_shared.chat_messages;
DROP FUNCTION IF EXISTS mekki_shared.update_session_total_tokens();
