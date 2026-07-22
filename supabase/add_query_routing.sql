-- Add explicit recipient fields for queries.

ALTER TABLE queries
  ADD COLUMN IF NOT EXISTS raised_by_role text NOT NULL DEFAULT 'Student',
  ADD COLUMN IF NOT EXISTS raised_to_role text NOT NULL DEFAULT 'Faculty',
  ADD COLUMN IF NOT EXISTS target_hod_id uuid REFERENCES users(id) ON DELETE SET NULL;

UPDATE queries
SET raised_by_role = CASE
  WHEN description ILIKE '%Raised By: Parent%' THEN 'Parent'
  ELSE 'Student'
END,
raised_to_role = CASE
  WHEN description ILIKE '%Raised To: HOD%' THEN 'HOD'
  ELSE 'Faculty'
END
WHERE raised_by_role = 'Student' AND raised_to_role = 'Faculty';