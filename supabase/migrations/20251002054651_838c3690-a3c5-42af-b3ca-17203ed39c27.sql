-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Create table for storing document chunks with embeddings
CREATE TABLE IF NOT EXISTS public.research_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_id UUID NOT NULL REFERENCES public.research_queries(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding vector(1536),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for vector similarity search
CREATE INDEX IF NOT EXISTS research_chunks_embedding_idx ON public.research_chunks 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create index for query_id lookups
CREATE INDEX IF NOT EXISTS research_chunks_query_id_idx ON public.research_chunks(query_id);

-- Enable RLS
ALTER TABLE public.research_chunks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own research chunks"
  ON public.research_chunks FOR SELECT
  USING (
    query_id IN (
      SELECT id FROM public.research_queries WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own research chunks"
  ON public.research_chunks FOR INSERT
  WITH CHECK (
    query_id IN (
      SELECT id FROM public.research_queries WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own research chunks"
  ON public.research_chunks FOR DELETE
  USING (
    query_id IN (
      SELECT id FROM public.research_queries WHERE user_id = auth.uid()
    )
  );