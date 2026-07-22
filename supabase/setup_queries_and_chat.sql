-- =========================================================================
-- SQL Migration: Setup Queries and Chat Tables (Clean Recreate)
-- Run this script in your Supabase SQL Editor.
-- =========================================================================

-- 1. Drop existing tables if they exist to avoid constraint and schema conflicts
DROP TABLE IF EXISTS query_messages CASCADE;
DROP TABLE IF EXISTS queries CASCADE;

-- 2. Create queries table referencing users(id)
CREATE TABLE queries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL,
  subject text NOT NULL,
  raised_by_role text NOT NULL DEFAULT 'Student',
  raised_to_role text NOT NULL DEFAULT 'Faculty',
  target_hod_id uuid REFERENCES users(id) ON DELETE SET NULL,
  description text,
  status text DEFAULT 'Pending' NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 3. Create query_messages table to store chat history
CREATE TABLE query_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query_id uuid REFERENCES queries(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  message text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 4. Enable RLS on both tables
ALTER TABLE queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE query_messages ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- 5. Create Security Policies for queries
-- =========================================================================

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
-- 6. Create Security Policies for query_messages
-- =========================================================================

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
