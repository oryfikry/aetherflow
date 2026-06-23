create table if not exists public.provider_settings (
  user_id text primary key,
  provider_name text not null,
  base_url text not null,
  api_key_encrypted text,
  chat_model text not null,
  embedding_model text,
  cohere_api_key_encrypted text,
  cohere_embedding_model text not null default 'embed-v4.0',
  cohere_input_type text not null default 'search_query'
    check (cohere_input_type in ('search_query', 'search_document', 'classification', 'clustering')),
  timeout_ms integer not null default 30000 check (timeout_ms > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.provider_settings enable row level security;

drop policy if exists "Service role manages provider settings" on public.provider_settings;
create policy "Service role manages provider settings"
  on public.provider_settings
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists provider_settings_set_updated_at on public.provider_settings;
create trigger provider_settings_set_updated_at
  before update on public.provider_settings
  for each row
  execute function public.set_updated_at();
