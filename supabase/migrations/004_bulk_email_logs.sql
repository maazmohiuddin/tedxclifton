-- Tracks every bulk invitation email batch sent from the admin panel.

CREATE TABLE IF NOT EXISTS public.bulk_email_logs (
  id             uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  sent_at        timestamptz DEFAULT now() NOT NULL,
  sent_by        uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  subject        text        NOT NULL,
  total_count    int         NOT NULL DEFAULT 0,
  sent_count     int         NOT NULL DEFAULT 0,
  failed_count   int         NOT NULL DEFAULT 0,
  recipients     text[]      NOT NULL DEFAULT '{}',
  failed_recipients jsonb    NOT NULL DEFAULT '[]'::jsonb
);

ALTER TABLE public.bulk_email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_manage_bulk_email_logs"
  ON public.bulk_email_logs
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());
