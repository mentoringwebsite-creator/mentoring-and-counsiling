-- Run this script in your Supabase SQL Editor to add missing HOD profile columns and unique constraints

-- 1. Add missing HOD profile columns
alter table hod_profiles add column if not exists qualification text;
alter table hod_profiles add column if not exists responsibilities text;
alter table hod_profiles add column if not exists joining_year text;
alter table hod_profiles add column if not exists office_room text;

-- 2. Add unique constraint on user_id if not present
do $$
begin
    if not exists (
        select 1 from pg_constraint where conname = 'hod_profiles_user_id_key'
    ) then
        alter table hod_profiles add constraint hod_profiles_user_id_key unique (user_id);
    end if;
exception
    when others then null;
end $$;

-- 3. Enable RLS and add full permissions
alter table hod_profiles enable row level security;

drop policy if exists "Allow all for authenticated users on hod_profiles" on hod_profiles;
create policy "Allow all for authenticated users on hod_profiles"
  on hod_profiles for all
  using (true)
  with check (true);
