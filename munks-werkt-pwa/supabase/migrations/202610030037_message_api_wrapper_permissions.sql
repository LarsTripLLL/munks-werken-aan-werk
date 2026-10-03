-- De api-wrappers bevatten zelf geen gegevenslogica. Ze roepen uitsluitend de
-- bestaande beveiligde functies aan, die auth.uid() en trajecttoegang controleren.

alter function api.list_my_message_threads() security definer;
alter function api.start_my_thread(text, public.thread_kind, text, text) security definer;
alter function api.reply_to_my_thread(uuid, text) security definer;
alter function api.mark_my_thread_read(uuid) security definer;
alter function api.list_my_assigned_threads(text) security definer;
alter function api.reply_as_assigned_coach(uuid, text) security definer;
alter function api.mark_assigned_thread_read(uuid) security definer;
alter function api.mark_assigned_thread_handled(uuid) security definer;

