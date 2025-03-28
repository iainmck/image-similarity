-- These are run in Supabase's SQL editor. 
-- CHECK BEFORE RUNNING:
-- Change the table name in all the places it appears.
-- Change the function name.
-- Change the embedding dimensions to match the embedding model.

CREATE TABLE embed_cohere_v1 (
  id bigint generated by default as identity primary key,
  user_id text,  -- in prod, this will be a non-null foreign key to the user table
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  filename text not null unique,
  image_url text not null,
  embedding vector(384)
);

ALTER TABLE embed_cohere_v1 ENABLE ROW LEVEL SECURITY;

-- Create index for the vector search
CREATE INDEX on embed_cohere_v1 using hnsw (embedding vector_cosine_ops);

-- Create function for the vector search
CREATE OR REPLACE FUNCTION search_embed_cohere_v1 (
  query_embedding vector(384),
  match_threshold float,
  match_count int,
  user_id_filter text DEFAULT NULL
)
RETURNS TABLE(vector_record embed_cohere_v1, distance float) AS $$
BEGIN
  RETURN QUERY
  WITH distances AS (
    SELECT 
      v,
      cosine_distance(v.embedding, query_embedding) AS distance
    FROM 
      embed_cohere_v1 v
    WHERE 
      (user_id_filter IS NULL OR v.user_id = user_id_filter)
  )
  SELECT 
    distances.v as vector_record,
    distances.distance as distance
  FROM 
    distances
  WHERE 
    distances.distance < 1 - match_threshold
  ORDER BY 
    distances.distance ASC
  LIMIT 
    LEAST(match_count, 50);
END;
$$ LANGUAGE plpgsql;

-- Uncomment to delete function
-- DROP FUNCTION search_embed_cohere_v1;