-- Create function for vector similarity search
CREATE OR REPLACE FUNCTION search_research_chunks(
  query_embedding text,
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  content text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    research_chunks.id,
    research_chunks.content,
    1 - (research_chunks.embedding <=> query_embedding::vector) AS similarity
  FROM research_chunks
  WHERE 1 - (research_chunks.embedding <=> query_embedding::vector) > match_threshold
  ORDER BY research_chunks.embedding <=> query_embedding::vector
  LIMIT match_count;
END;
$$;