-- SQL migration for User Reading History (Supabase / Postgres)
-- Run in Supabase SQL editor or with psql

-- Table: user_document_history
-- Tracks user interactions with documents
CREATE TABLE IF NOT EXISTS public.user_document_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,  -- Can be null for anonymous users (use localStorage)
  document_id bigint NOT NULL,
  status text DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'saved', 'noted')),
  notes_count integer DEFAULT 0,
  last_accessed timestamptz DEFAULT now(),
  time_spent_seconds integer DEFAULT 0,
  scroll_position real DEFAULT 0,  -- 0-1 percentage
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Unique constraint: one record per user-document pair
  UNIQUE(user_id, document_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_doc_history_user_id ON public.user_document_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_doc_history_document_id ON public.user_document_history(document_id);
CREATE INDEX IF NOT EXISTS idx_user_doc_history_status ON public.user_document_history(status);
CREATE INDEX IF NOT EXISTS idx_user_doc_history_last_accessed ON public.user_document_history(last_accessed DESC);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_document_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS trigger_user_document_history_updated_at ON public.user_document_history;
CREATE TRIGGER trigger_user_document_history_updated_at
  BEFORE UPDATE ON public.user_document_history
  FOR EACH ROW
  EXECUTE FUNCTION update_user_document_history_updated_at();

-- Comment
COMMENT ON TABLE public.user_document_history IS 'Tracks user reading history and interactions with documents';
