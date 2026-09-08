-- Munks Werkt - gecontroleerde opslag door deelnemers
-- Voer dit bestand uit na 002_content.sql.

create or replace function public.save_my_answer(
  p_trajectory_code text,
  p_content_key text,
  p_answer_text text default null,
  p_answer_data jsonb default null,
  p_skipped boolean default false
)
returns public.answers
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_enrollment_id uuid;
  v_content_id uuid;
  v_answer public.answers;
begin
  if auth.uid() is null then
    raise exception 'Aanmelden is vereist.' using errcode = '42501';
  end if;

  select e.id
    into v_enrollment_id
  from public.enrollments e
  join public.trajectory_runs tr on tr.id = e.trajectory_run_id
  where e.participant_id = auth.uid()
    and tr.code = p_trajectory_code
    and e.status in ('invited', 'active', 'paused')
  limit 1;

  if v_enrollment_id is null then
    raise exception 'Geen toegestane deelname gevonden.' using errcode = '42501';
  end if;

  select sc.id
    into v_content_id
  from public.step_content sc
  join public.steps s on s.id = sc.step_id
  join public.trajectory_runs tr on tr.program_id = s.program_id
  where tr.code = p_trajectory_code
    and sc.content_key = p_content_key
    and sc.active
    and s.active
  limit 1;

  if v_content_id is null then
    raise exception 'Vraag of opdracht niet gevonden.' using errcode = '22023';
  end if;

  if not p_skipped
     and nullif(btrim(coalesce(p_answer_text, '')), '') is null
     and p_answer_data is null then
    raise exception 'Een antwoord ontbreekt.' using errcode = '22023';
  end if;

  insert into public.answers (
    enrollment_id, content_id, answer_text, answer_data, skipped, saved_at, updated_at
  ) values (
    v_enrollment_id,
    v_content_id,
    case when p_skipped then null else nullif(btrim(p_answer_text), '') end,
    case when p_skipped then null else p_answer_data end,
    p_skipped,
    now(),
    now()
  )
  on conflict (enrollment_id, content_id) do update set
    answer_text = excluded.answer_text,
    answer_data = excluded.answer_data,
    skipped = excluded.skipped,
    updated_at = now()
  returning * into v_answer;

  insert into public.audit_log (
    actor_user_id, enrollment_id, action, data_category, target_table, target_id
  ) values (
    auth.uid(), v_enrollment_id, 'answer_saved', 'trajectory_answer', 'answers', v_answer.id::text
  );

  return v_answer;
end;
$$;

create or replace function public.save_my_measurement(
  p_trajectory_code text,
  p_moment public.measurement_moment,
  p_support_confidence smallint,
  p_self_confidence smallint,
  p_motivation smallint,
  p_future_perspective smallint,
  p_employee_skills smallint
)
returns public.measurements
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_enrollment_id uuid;
  v_measurement public.measurements;
begin
  if auth.uid() is null then
    raise exception 'Aanmelden is vereist.' using errcode = '42501';
  end if;

  if p_support_confidence not between 1 and 10
     or p_self_confidence not between 1 and 10
     or p_motivation not between 1 and 10
     or p_future_perspective not between 1 and 10
     or p_employee_skills not between 1 and 10 then
    raise exception 'Iedere score moet tussen 1 en 10 liggen.' using errcode = '22023';
  end if;

  select e.id
    into v_enrollment_id
  from public.enrollments e
  join public.trajectory_runs tr on tr.id = e.trajectory_run_id
  where e.participant_id = auth.uid()
    and tr.code = p_trajectory_code
    and e.status in ('invited', 'active', 'paused')
  limit 1;

  if v_enrollment_id is null then
    raise exception 'Geen toegestane deelname gevonden.' using errcode = '42501';
  end if;

  insert into public.measurements (
    enrollment_id,
    moment,
    support_confidence,
    self_confidence,
    motivation,
    future_perspective,
    employee_skills,
    measured_at,
    updated_at
  ) values (
    v_enrollment_id,
    p_moment,
    p_support_confidence,
    p_self_confidence,
    p_motivation,
    p_future_perspective,
    p_employee_skills,
    now(),
    now()
  )
  on conflict (enrollment_id, moment) do update set
    support_confidence = excluded.support_confidence,
    self_confidence = excluded.self_confidence,
    motivation = excluded.motivation,
    future_perspective = excluded.future_perspective,
    employee_skills = excluded.employee_skills,
    updated_at = now()
  returning * into v_measurement;

  insert into public.audit_log (
    actor_user_id, enrollment_id, action, data_category, target_table, target_id,
    metadata
  ) values (
    auth.uid(),
    v_enrollment_id,
    'measurement_saved',
    'rsd_measurement',
    'measurements',
    v_measurement.id::text,
    jsonb_build_object('moment', p_moment)
  );

  return v_measurement;
end;
$$;

revoke all on function public.save_my_answer(text, text, text, jsonb, boolean) from public, anon;
revoke all on function public.save_my_measurement(text, public.measurement_moment, smallint, smallint, smallint, smallint, smallint) from public, anon;

grant execute on function public.save_my_answer(text, text, text, jsonb, boolean) to authenticated;
grant execute on function public.save_my_measurement(text, public.measurement_moment, smallint, smallint, smallint, smallint, smallint) to authenticated;

