create table public.agenttube_channels (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 channel_name text not null check (length(channel_name) between 1 and 120),
 audience text not null default '',
 language text not null default 'bn',
 niche text not null default '',
 cadence_per_week integer not null default 2 check (cadence_per_week between 1 and 7),
 created_at timestamptz not null default now(),
 unique(user_id)
);
create table public.agenttube_drafts (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 topic text not null check(length(topic) between 3 and 2000),
 language text not null default 'bn',
 duration_seconds integer not null default 60 check(duration_seconds between 15 and 600),
 status text not null default 'draft' check(status = 'draft'),
 created_at timestamptz not null default now()
);
create index agenttube_drafts_owner_created on public.agenttube_drafts(user_id,created_at desc);
alter table public.agenttube_channels enable row level security;
alter table public.agenttube_drafts enable row level security;
revoke all on public.agenttube_channels,public.agenttube_drafts from anon;
grant select,insert,update,delete on public.agenttube_channels,public.agenttube_drafts to authenticated;
create policy channels_owner on public.agenttube_channels for all to authenticated using((select auth.uid()) = user_id) with check((select auth.uid()) = user_id);
create policy drafts_owner on public.agenttube_drafts for all to authenticated using((select auth.uid()) = user_id) with check((select auth.uid()) = user_id);
insert into storage.buckets(id,name,public) values('agenttube-media','agenttube-media',false);
create policy agenttube_media_owner on storage.objects for all to authenticated
using(bucket_id = 'agenttube-media' and (storage.foldername(name))[1] = (select auth.uid())::text)
with check(bucket_id = 'agenttube-media' and (storage.foldername(name))[1] = (select auth.uid())::text);