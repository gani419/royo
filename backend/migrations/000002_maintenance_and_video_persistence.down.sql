BEGIN;
ALTER TABLE chat_messages DROP COLUMN IF EXISTS videos;
DROP TABLE IF EXISTS maintenance_records;
COMMIT;
