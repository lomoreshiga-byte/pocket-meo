-- Create a table to store integration tokens
create table if not exists public.integrations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  provider text not null check (provider in ('google', 'instagram', 'line')),
  provider_account_id text, -- ID from the provider (e.g. Google User ID, Instagram User ID)
  access_token text,
  refresh_token text,
  expires_at bigint,
  meta_data jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Ensure one provider link per user (unless we want multiple accounts per provider, but usually 1:1 for this app context)
  unique(user_id, provider)
);

-- RLS Policies
alter table public.integrations enable row level security;

-- Policy: Users can only view/edit their own integrations
create policy "Users can view their own integrations"
  on public.integrations for select
  using (auth.uid() = user_id);

create policy "Users can insert their own integrations"
  on public.integrations for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own integrations"
  on public.integrations for update
  using (auth.uid() = user_id);

create policy "Users can delete their own integrations"
  on public.integrations for delete
  using (auth.uid() = user_id);

-- Indexes
create index integrations_user_id_idx on public.integrations(user_id);
