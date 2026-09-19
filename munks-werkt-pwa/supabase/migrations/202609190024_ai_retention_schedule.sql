-- Verwijder ieder AI-bericht uiterlijk bij de eerstvolgende uurlijkse opruimbeurt
-- na 90 dagen, ook als niemand de assistent meer gebruikt.
create extension if not exists pg_cron;

create index ai_messages_created_at_idx on public.ai_messages(created_at);
create index ai_conversations_updated_at_idx on public.ai_conversations(updated_at);

create function public.cleanup_ai_retention()
returns void
language plpgsql
security definer
set search_path = ''
as $function$
begin
  delete from public.ai_messages
  where created_at < now() - interval '90 days';

  delete from public.ai_conversations
  where updated_at < now() - interval '90 days'
    and not exists (
      select 1 from public.ai_messages
      where ai_messages.conversation_id = ai_conversations.id
    );

  delete from public.ai_daily_usage
  where usage_date < current_date - interval '2 days';
end;
$function$;

revoke all on function public.cleanup_ai_retention() from public, anon, authenticated;

select cron.schedule(
  'munks-ai-retention-90d',
  '0 * * * *',
  'select public.cleanup_ai_retention()'
);
