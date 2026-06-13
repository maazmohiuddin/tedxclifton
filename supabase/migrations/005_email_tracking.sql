-- Per-recipient send records and open-pixel tracking.

CREATE TABLE IF NOT EXISTS public.email_send_records (
  id               uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  log_id           uuid        REFERENCES public.bulk_email_logs(id) ON DELETE CASCADE,
  email            text        NOT NULL,
  sent_at          timestamptz DEFAULT now(),
  delivery_status  text        NOT NULL DEFAULT 'pending', -- pending | sent | failed
  smtp_message_id  text,
  smtp_error       text,
  mx_valid         boolean,
  opened_at        timestamptz,
  open_count       int         NOT NULL DEFAULT 0,
  last_opened_at   timestamptz
);

ALTER TABLE public.email_send_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_manage_send_records"
  ON public.email_send_records FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

CREATE TABLE IF NOT EXISTS public.email_open_events (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  record_id   uuid        REFERENCES public.email_send_records(id) ON DELETE CASCADE,
  opened_at   timestamptz DEFAULT now(),
  ip_address  text,
  user_agent  text
);

ALTER TABLE public.email_open_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_read_open_events"
  ON public.email_open_events FOR SELECT TO authenticated
  USING (is_admin());
