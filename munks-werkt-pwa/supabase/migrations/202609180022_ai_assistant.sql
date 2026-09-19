create table public.ai_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

create table public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  enrollment_id uuid not null references public.enrollments(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
  sender text not null check (sender in ('participant','assistant')),
  body text not null check (char_length(body) between 1 and 8000),
  input_tokens integer,
  output_tokens integer,
  created_at timestamptz not null default now()
);

create index ai_conversations_user_idx on public.ai_conversations(user_id, updated_at desc);
create unique index ai_conversations_user_enrollment_unique on public.ai_conversations(user_id, enrollment_id);
create index ai_messages_conversation_idx on public.ai_messages(conversation_id, created_at);
alter table public.ai_preferences enable row level security;
alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;
revoke all on public.ai_preferences, public.ai_conversations, public.ai_messages from anon, authenticated;

insert into public.ai_preferences(user_id, enabled)
select distinct on (actor_user_id) actor_user_id, coalesce((metadata->>'aiAssistantEnabled')::boolean, false)
from public.audit_log
where action='account_activated' and actor_user_id is not null
order by actor_user_id, occurred_at desc
on conflict(user_id) do nothing;
