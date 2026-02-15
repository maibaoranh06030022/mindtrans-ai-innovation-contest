-- SQL migration for Supabase / Postgres
-- Run in Supabase SQL editor or with psql connected to your DB

CREATE TABLE IF NOT EXISTS public.annotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id bigint,
  user_id uuid,
  type text NOT NULL,
  color text,
  content text,
  position_data jsonb,
  layer text DEFAULT 'original',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_annotations_document_id ON public.annotations(document_id);
CREATE INDEX IF NOT EXISTS idx_annotations_user_id ON public.annotations(user_id);
CREATE INDEX IF NOT EXISTS idx_annotations_type ON public.annotations(type);
