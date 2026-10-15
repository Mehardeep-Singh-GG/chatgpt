-- =========================================================================
-- Supabase Schema for Stealth Couples Chat App
-- =========================================================================
-- Optional: If you want persistent cloud storage across all Vercel serverless
-- instances, create a free project at https://supabase.com and run this script
-- in the SQL Editor. Then add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_ANON_KEY to Vercel.
-- =========================================================================

CREATE TABLE IF NOT EXISTS rooms (
  id TEXT PRIMARY KEY,
  config JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  sender TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  type TEXT NOT NULL,
  text TEXT,
  media JSONB,
  saved_in_chat BOOLEAN DEFAULT FALSE,
  opened BOOLEAN DEFAULT FALSE,
  opened_at BIGINT,
  reactions JSONB DEFAULT '{}'::jsonb,
  created_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_messages_room ON messages(room_id, created_at ASC);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
