-- Ensure one farmer registration per user (one login = one farmer profile)
-- Adds UNIQUE(user_id) so each user can have only one farmer record
DO $$
BEGIN
  ALTER TABLE public.farmers ADD CONSTRAINT farmers_user_id_unique UNIQUE (user_id);
EXCEPTION
  WHEN duplicate_object THEN
    NULL; -- constraint already exists
  WHEN unique_violation THEN
    RAISE NOTICE 'Duplicate user_ids in farmers table. Clean up before adding constraint.';
END $$;
