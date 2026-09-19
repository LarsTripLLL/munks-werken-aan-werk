-- Reserveer AI-aanvragen atomair voordat externe API's worden aangeroepen.
create table public.ai_daily_usage (
  scope text not null check (scope in ('user', 'global')),
  owner text not null,
  usage_date date not null,
  used integer not null check (used >= 0),
  primary key (scope, owner, usage_date)
);

alter table public.ai_daily_usage enable row level security;
revoke all on public.ai_daily_usage from anon, authenticated;

-- Reeds uitgevoerde vragen van vandaag tellen mee na de migratie.
insert into public.ai_daily_usage(scope, owner, usage_date, used)
select 'user', ai_conversations.user_id::text, current_date, count(*)::integer
from public.ai_messages
join public.ai_conversations on ai_conversations.id = ai_messages.conversation_id
where ai_messages.sender = 'participant' and ai_messages.created_at >= current_date
group by ai_conversations.user_id;

insert into public.ai_daily_usage(scope, owner, usage_date, used)
select 'global', '*', current_date, count(*)::integer
from public.ai_messages
where sender = 'participant' and created_at >= current_date
having count(*) > 0;
