-- Beperk de via PostgREST zichtbare database-interface tot de berichtenfuncties
-- die session-api namens de aangemelde gebruiker uitvoert.

create schema if not exists api;
revoke all on schema api from public, anon;
grant usage on schema api to authenticated;

create or replace function api.list_my_message_threads()
returns jsonb language sql stable security invoker set search_path = public, pg_temp
as $$ select public.list_my_message_threads(); $$;

create or replace function api.start_my_thread(p_trajectory_code text, p_kind public.thread_kind, p_subject text, p_body text)
returns uuid language sql volatile security invoker set search_path = public, pg_temp
as $$ select public.start_my_thread(p_trajectory_code, p_kind, p_subject, p_body); $$;

create or replace function api.reply_to_my_thread(p_thread_id uuid, p_body text)
returns uuid language sql volatile security invoker set search_path = public, pg_temp
as $$ select public.reply_to_my_thread(p_thread_id, p_body); $$;

create or replace function api.mark_my_thread_read(p_thread_id uuid)
returns void language sql volatile security invoker set search_path = public, pg_temp
as $$ select public.mark_my_thread_read(p_thread_id); $$;

create or replace function api.list_my_assigned_threads(p_trajectory_code text)
returns jsonb language sql stable security invoker set search_path = public, pg_temp
as $$ select public.list_my_assigned_threads(p_trajectory_code); $$;

create or replace function api.reply_as_assigned_coach(p_thread_id uuid, p_body text)
returns uuid language sql volatile security invoker set search_path = public, pg_temp
as $$ select public.reply_as_assigned_coach(p_thread_id, p_body); $$;

create or replace function api.mark_assigned_thread_read(p_thread_id uuid)
returns void language sql volatile security invoker set search_path = public, pg_temp
as $$ select public.mark_assigned_thread_read(p_thread_id); $$;

create or replace function api.mark_assigned_thread_handled(p_thread_id uuid)
returns void language sql volatile security invoker set search_path = public, pg_temp
as $$ select public.mark_assigned_thread_handled(p_thread_id); $$;

revoke all on all functions in schema api from public, anon;
grant execute on all functions in schema api to authenticated;

