-- Mark obsolete creation notices terminally, preserving full audit trail.
-- Applies to the notification queue only. No application incidents are changed.
-- Before applying to remote, use normal migration deployment process.
ALTER TABLE public.parking_notification_outbox
  DROP CONSTRAINT IF EXISTS parking_notification_outbox_state_check;
ALTER TABLE public.parking_notification_outbox
  ADD CONSTRAINT parking_notification_outbox_state_check
  CHECK (state IN ('pending','sending','sent','failed','obsolete'));

COMMENT ON COLUMN public.parking_notification_outbox.state IS
  'obsolete: terminal notification for deleted/merged case; retained for audit, never delivered';
