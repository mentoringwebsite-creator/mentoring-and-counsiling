-- =========================================================================
-- SQL Migration: Setup Queries and Chat Tables
-- Run this script in your Supabase SQL Editor.
-- =========================================================================

-- 1. Re-link queries.student_id to refer to users.id instead of students.id
ALTER TABLE queries DROP CONSTRAINT IF EXISTS queries_student_id_fkey;
ALTER TABLE queries ADD CONSTRAINT queries_student_id_fkey FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE;

-- 2. Create query_messages table to store chat history
CREATE TABLE IF NOT EXISTS query_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query_id uuid REFERENCES queries(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  message text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 3. Enable RLS on both tables
ALTER TABLE queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE query_messages ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- 4. Recreate Security Policies for queries
-- =========================================================================

DROP POLICY IF EXISTS "Allow select queries" ON queries;
DROP POLICY IF EXISTS "Allow insert queries" ON queries;
DROP POLICY IF EXISTS "Allow update queries" ON queries;

-- Students can view their own queries; faculty, HODs, and admins can view all.
CREATE POLICY "Allow select queries" ON queries
  FOR SELECT
  USING (
    auth.uid() = student_id
    OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'faculty', 'hod')
  );

-- Students can insert their own queries.
CREATE POLICY "Allow insert queries" ON queries
  FOR INSERT
  WITH CHECK (
    auth.uid() = student_id
  );

-- Students can update/close their own queries; faculty, HODs, and admins can update any query status.
CREATE POLICY "Allow update queries" ON queries
  FOR UPDATE
  USING (
    auth.uid() = student_id
    OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'faculty', 'hod')
  )
  WITH CHECK (
    auth.uid() = student_id
    OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'faculty', 'hod')
  );

-- =========================================================================
-- 5. Create Security Policies for query_messages
-- =========================================================================

DROP POLICY IF EXISTS "Allow select query_messages" ON query_messages;
DROP POLICY IF EXISTS "Allow insert query_messages" ON query_messages;

-- Students can read messages for their own queries; faculty, HODs, and admins can read messages for any query.
CREATE POLICY "Allow select query_messages" ON query_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM queries
      WHERE queries.id = query_messages.query_id
      AND (
        queries.student_id = auth.uid()
        OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'faculty', 'hod')
      )
    )
  );

-- Student who raised the query or any faculty/HOD/admin can insert chat messages.
CREATE POLICY "Allow insert query_messages" ON query_messages
  FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM queries
      WHERE queries.id = query_messages.query_id
      AND (
        queries.student_id = auth.uid()
        OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'faculty', 'hod')
      )
    )
  );
