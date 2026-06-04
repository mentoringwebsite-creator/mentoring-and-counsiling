-- Add missing profile_photo columns to faculty and HOD profiles
alter table faculty_profiles add column if not exists profile_photo text;
alter table hod_profiles add column if not exists profile_photo text;

-- 1. Dynamically drop ALL existing policies on users and profile tables to prevent duplicates/collisions
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public' 
          AND tablename IN ('users', 'student_profiles', 'faculty_profiles', 'hod_profiles')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- 2. Create updated, non-recursive policies using JWT metadata
create policy "Allow users to select their own user record" on users for select
  using (
    auth.uid() = id
    or (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

create policy "Allow admin to manage users" on users for update
  using (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  )
  with check (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

create policy "Allow own student profile select" on student_profiles for select
  using (
    auth.uid() = user_id
    or (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

create policy "Allow own student profile update" on student_profiles for update
  using (
    auth.uid() = user_id
    or (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  )
  with check (
    auth.uid() = user_id
    or (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

create policy "Allow own faculty profile select" on faculty_profiles for select
  using (
    auth.uid() = user_id
    or (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

create policy "Allow own faculty profile update" on faculty_profiles for update
  using (
    auth.uid() = user_id
    or (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  )
  with check (
    auth.uid() = user_id
    or (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

create policy "Allow own hod profile select" on hod_profiles for select
  using (
    auth.uid() = user_id
    or (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

create policy "Allow own hod profile update" on hod_profiles for update
  using (
    auth.uid() = user_id
    or (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  )
  with check (
    auth.uid() = user_id
    or (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- 3. Ensure the admin user's metadata contains the 'admin' role in auth.users
UPDATE auth.users 
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'admin')
WHERE email = 'mentoringwebsite47@gmail.com';

