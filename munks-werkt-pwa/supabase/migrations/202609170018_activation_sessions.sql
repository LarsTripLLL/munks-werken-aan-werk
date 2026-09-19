alter table public.activation_invites
  add column session_token_hash text,
  add column session_expires_at timestamptz;

