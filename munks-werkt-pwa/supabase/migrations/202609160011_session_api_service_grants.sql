-- Minimale serverrechten voor het bepalen van de ingelogde gebruiker en diens rol.
-- Deze rechten gelden alleen voor de geheime service_role van serverfuncties;
-- anon en authenticated houden hun bestaande, beperkte browserrechten.

grant select on table
  public.profiles,
  public.global_user_roles,
  public.trajectory_staff,
  public.enrollments
to service_role;
