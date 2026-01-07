-- Add scheduled_at column to posts table
alter table posts add column if not exists scheduled_at timestamp with time zone;

-- Ensure status is present (it likely is, but good to be safe)
-- alter table posts add column if not exists status text default 'draft';
