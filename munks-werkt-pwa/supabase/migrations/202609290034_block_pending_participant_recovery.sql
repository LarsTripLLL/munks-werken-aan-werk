-- Een deelnemer met uitsluitend een open uitnodiging mag het tijdelijke
-- Supabase-account niet via wachtwoordherstel overnemen. Bestaande open
-- uitnodigingen worden geblokkeerd; de activation-api heft deze blokkade pas
-- op nadat de volledige activatie is afgerond.

update auth.users auth_user
set banned_until = now() + interval '100 years'
where exists (
  select 1
  from public.enrollments enrollment
  where enrollment.participant_id = auth_user.id
    and enrollment.status = 'invited'
)
and not exists (
  select 1
  from public.enrollments enrollment
  where enrollment.participant_id = auth_user.id
    and enrollment.status <> 'invited'
);

