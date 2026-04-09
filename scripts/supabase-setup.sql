-- RelayPay — Supabase pgvector setup
-- Run this in your Supabase SQL Editor before ingesting documents.

-- 1. Enable pgvector extension
create extension if not exists vector;

-- 2. Documents table
create table if not exists documents (
  id         bigserial primary key,
  content    text        not null,
  embedding  vector(1536),
  metadata   jsonb,
  created_at timestamptz default now()
);

-- 3. Similarity search function
create or replace function match_documents(
  query_embedding vector(1536),
  match_threshold float  default 0.4,
  match_count     int    default 3
)
returns table (
  id         bigint,
  content    text,
  metadata   jsonb,
  similarity float
)
language sql stable
as $$
  select
    id,
    content,
    metadata,
    1 - (embedding <=> query_embedding) as similarity
  from documents
  where 1 - (embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
$$;

-- 4. HNSW index for fast cosine similarity search
create index if not exists documents_embedding_hnsw_idx
  on documents using hnsw (embedding vector_cosine_ops);
