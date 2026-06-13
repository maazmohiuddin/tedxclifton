-- Per-recipient VIP access tokens generated during bulk email sends.
-- Each token unlocks the VIP card generator for 48 hours.
CREATE TABLE IF NOT EXISTS public.vip_invite_tokens (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  token       text NOT NULL UNIQUE,
  email       text NOT NULL,
  log_id      uuid REFERENCES public.bulk_email_logs(id)      ON DELETE SET NULL,
  record_id   uuid REFERENCES public.email_send_records(id)   ON DELETE SET NULL,
  created_at  timestamptz DEFAULT now() NOT NULL,
  expires_at  timestamptz NOT NULL,
  redeemed_at timestamptz,
  redeemed_ip text
);

CREATE INDEX vip_tokens_token_idx   ON public.vip_invite_tokens (token);
CREATE INDEX vip_tokens_record_idx  ON public.vip_invite_tokens (record_id);
CREATE INDEX vip_tokens_expires_idx ON public.vip_invite_tokens (expires_at);

ALTER TABLE public.vip_invite_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_manage_vip_tokens"
  ON public.vip_invite_tokens FOR ALL TO authenticated
  USING ((SELECT is_admin()));
