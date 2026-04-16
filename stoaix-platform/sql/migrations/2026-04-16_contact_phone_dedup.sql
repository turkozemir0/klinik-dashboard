-- ============================================================
-- Migration: Contact Phone Deduplication
-- Date: 2026-04-16
-- Purpose:
--   1. Normalize existing contacts.phone values to E.164 format
--   2. Merge duplicate contacts with same (organization_id, phone)
--      — keeps earliest created contact, reassigns all FK references
-- ============================================================

-- ── Step 1: Normalize phone values ──────────────────────────────────────────
-- Rules (safe conversions only, no country-code guessing):
--   '+...'       → strip non-digits after +, keep if 7-15 digits
--   '00...'      → replace 00 with +
--   bare digits, 9-15 chars, not starting with '0' → add +
--   anything else → leave unchanged (local format / ambiguous)

UPDATE public.contacts
SET phone = CASE
  WHEN phone LIKE '+%' THEN
    CASE WHEN length(regexp_replace(phone, '\D', '', 'g')) BETWEEN 7 AND 15
         THEN '+' || regexp_replace(phone, '\D', '', 'g')
         ELSE phone
    END
  WHEN phone LIKE '00%' THEN
    CASE WHEN length(regexp_replace(substring(phone FROM 3), '\D', '', 'g')) BETWEEN 7 AND 15
         THEN '+' || regexp_replace(substring(phone FROM 3), '\D', '', 'g')
         ELSE phone
    END
  WHEN phone ~ '^\d{9,15}$' AND phone NOT LIKE '0%' THEN
    '+' || phone
  ELSE
    phone
END
WHERE phone IS NOT NULL;

-- ── Step 2: Merge duplicate contacts ────────────────────────────────────────
-- For each (organization_id, phone) group with > 1 contact:
--   - keeper = earliest created_at (ties broken by lower UUID)
--   - all FK references reassigned from duplicate → keeper
--   - duplicate's channel_identifiers merged into keeper
--   - duplicate contact deleted

DO $$
DECLARE
  rec       RECORD;
  dup_id    uuid;
  keeper_id uuid;
  dup_ids   uuid[];
BEGIN
  FOR rec IN
    SELECT
      organization_id,
      phone,
      array_agg(id ORDER BY created_at ASC, id ASC) AS all_ids
    FROM public.contacts
    WHERE phone IS NOT NULL
    GROUP BY organization_id, phone
    HAVING COUNT(*) > 1
  LOOP
    keeper_id := rec.all_ids[1];
    dup_ids   := rec.all_ids[2:array_length(rec.all_ids, 1)];

    FOREACH dup_id IN ARRAY dup_ids LOOP

      -- Reassign leads (NOT NULL FK — must update before delete)
      UPDATE public.leads
        SET contact_id = keeper_id
        WHERE contact_id = dup_id;

      -- Reassign conversations (NOT NULL FK — must update before delete)
      UPDATE public.conversations
        SET contact_id = keeper_id
        WHERE contact_id = dup_id;

      -- Reassign voice_calls (nullable, ON DELETE SET NULL — update for data quality)
      UPDATE public.voice_calls
        SET contact_id = keeper_id
        WHERE contact_id = dup_id;

      -- Reassign follow_up_tasks — partial unique index on (org, contact, stage) WHERE pending
      -- Delete dup's pending tasks that would conflict, then reassign the rest
      DELETE FROM public.follow_up_tasks dup_task
        WHERE dup_task.contact_id = dup_id
          AND dup_task.status = 'pending'
          AND EXISTS (
            SELECT 1 FROM public.follow_up_tasks keeper_task
            WHERE keeper_task.contact_id      = keeper_id
              AND keeper_task.sequence_stage  = dup_task.sequence_stage
              AND keeper_task.organization_id = dup_task.organization_id
              AND keeper_task.status          = 'pending'
          );

      UPDATE public.follow_up_tasks
        SET contact_id = keeper_id
        WHERE contact_id = dup_id;

      -- Reassign workflow_runs (nullable, no ON DELETE — update to avoid broken refs)
      UPDATE public.workflow_runs
        SET contact_id = keeper_id
        WHERE contact_id = dup_id;

      -- Reassign appointments (nullable)
      UPDATE public.appointments
        SET contact_id = keeper_id
        WHERE contact_id = dup_id;

      -- Reassign satisfaction_surveys (nullable)
      UPDATE public.satisfaction_surveys
        SET contact_id = keeper_id
        WHERE contact_id = dup_id;

      -- Merge channel_identifiers: keeper gets dup's identifiers merged in
      UPDATE public.contacts
        SET channel_identifiers = channel_identifiers || (
          SELECT channel_identifiers
          FROM public.contacts
          WHERE id = dup_id
        )
        WHERE id = keeper_id;

      -- Delete the duplicate (no remaining FK refs, so safe)
      DELETE FROM public.contacts WHERE id = dup_id;

      RAISE NOTICE 'Merged contact % → % (org: %, phone: %)',
        dup_id, keeper_id, rec.organization_id, rec.phone;

    END LOOP;
  END LOOP;
END $$;

-- ── Verification query (run manually to confirm) ─────────────────────────────
-- SELECT phone, count(*) FROM public.contacts
-- WHERE phone IS NOT NULL
-- GROUP BY organization_id, phone
-- HAVING count(*) > 1;
-- Expected: 0 rows
