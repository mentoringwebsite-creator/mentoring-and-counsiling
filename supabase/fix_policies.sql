-- Drop old policies causing infinite recursion
drop policy if exists "Allow users to select their own user record" on users;
drop policy if exists "Allow admin to manage users" on users;

drop policy if exists "Allow own student profile select" on student_profiles;
drop policy if exists "Allow own student profile update" on student_profiles;

drop policy if exists "Allow own faculty profile select" on faculty_profiles;
drop policy if exists "Allow own faculty profile update" on faculty_profiles;

drop policy if exists "Allow own hod profile select" on hod_profiles;
drop policy if exists "Allow own hod profile update" on hod_profiles;

-- Create updated policies using JWT claims metadata instead of recursive queries
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
