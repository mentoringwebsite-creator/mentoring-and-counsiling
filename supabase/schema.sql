create extension if not exists pgcrypto;

create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  roll_number text unique not null,
  name text not null,
  email text unique not null,
  branch text,
  section text,
  cgpa numeric(4,2) default 0,
  backlogs integer default 0,
  phone text,
  dob date,
  profile_image text,
  created_at timestamp with time zone default now()
);

create table if not exists faculty (
  id uuid primary key default gen_random_uuid(),
  faculty_id text unique not null,
  name text not null,
  department text,
  designation text,
  email text unique not null,
  created_at timestamp with time zone default now()
);

create table if not exists users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  name text not null,
  role text not null check (role in ('student', 'faculty', 'hod', 'admin')),
  status text not null default 'Pending' check (status in ('Pending', 'Approved', 'Rejected')),
  created_at timestamp with time zone default now()
);

create table if not exists student_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  roll_number text unique not null,
  branch text,
  section text,
  academic_year text,
  phone text,
  dob date,
  profile_photo text,
  created_at timestamp with time zone default now()
);

create table if not exists faculty_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  faculty_id text unique not null,
  designation text,
  qualification text,
  department text,
  subjects text,
  contact_number text,
  created_at timestamp with time zone default now()
);

create table if not exists hod_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  faculty_id text unique not null,
  designation text,
  department text,
  contact_number text,
  created_at timestamp with time zone default now()
);

create table if not exists subjects (
  id uuid primary key default gen_random_uuid(),
  subject_name text not null,
  semester integer not null,
  credits integer default 0,
  created_at timestamp with time zone default now()
);

create table if not exists student_marks (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade,
  subject_id uuid references subjects(id) on delete cascade,
  mid1 integer default 0,
  mid2 integer default 0,
  semester_marks integer default 0,
  gpa numeric(4,2) default 0,
  created_at timestamp with time zone default now()
);

create table if not exists queries (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade,
  type text not null,
  subject text not null,
  description text,
  status text default 'Pending',
  created_at timestamp with time zone default now()
);

alter table students enable row level security;
alter table faculty enable row level security;
alter table subjects enable row level security;
alter table student_marks enable row level security;
alter table queries enable row level security;

alter table users enable row level security;
alter table student_profiles enable row level security;
alter table faculty_profiles enable row level security;
alter table hod_profiles enable row level security;

create policy "Allow users to insert their own user record" on users for insert
  with check (auth.uid() = id);

create policy "Allow users to select their own user record" on users for select
  using (
    auth.uid() = id
    or exists(
      select 1 from users ur where ur.id = auth.uid() and ur.role = 'admin'
    )
  );

create policy "Allow admin to manage users" on users for update
  using (
    exists(
      select 1 from users ur where ur.id = auth.uid() and ur.role = 'admin'
    )
  )
  with check (
    exists(
      select 1 from users ur where ur.id = auth.uid() and ur.role = 'admin'
    )
  );

create policy "Allow own student profile insert" on student_profiles for insert
  with check (auth.uid() = user_id);

create policy "Allow own student profile select" on student_profiles for select
  using (
    auth.uid() = user_id
    or exists(
      select 1 from users ur where ur.id = auth.uid() and ur.role = 'admin'
    )
  );

create policy "Allow own student profile update" on student_profiles for update
  using (
    auth.uid() = user_id
    or exists(
      select 1 from users ur where ur.id = auth.uid() and ur.role = 'admin'
    )
  )
  with check (
    auth.uid() = user_id
    or exists(
      select 1 from users ur where ur.id = auth.uid() and ur.role = 'admin'
    )
  );

create policy "Allow own faculty profile insert" on faculty_profiles for insert
  with check (auth.uid() = user_id);

create policy "Allow own faculty profile select" on faculty_profiles for select
  using (
    auth.uid() = user_id
    or exists(
      select 1 from users ur where ur.id = auth.uid() and ur.role = 'admin'
    )
  );

create policy "Allow own faculty profile update" on faculty_profiles for update
  using (
    auth.uid() = user_id
    or exists(
      select 1 from users ur where ur.id = auth.uid() and ur.role = 'admin'
    )
  )
  with check (
    auth.uid() = user_id
    or exists(
      select 1 from users ur where ur.id = auth.uid() and ur.role = 'admin'
    )
  );

create policy "Allow own hod profile insert" on hod_profiles for insert
  with check (auth.uid() = user_id);

create policy "Allow own hod profile select" on hod_profiles for select
  using (
    auth.uid() = user_id
    or exists(
      select 1 from users ur where ur.id = auth.uid() and ur.role = 'admin'
    )
  );

create policy "Allow own hod profile update" on hod_profiles for update
  using (
    auth.uid() = user_id
    or exists(
      select 1 from users ur where ur.id = auth.uid() and ur.role = 'admin'
    )
  )
  with check (
    auth.uid() = user_id
    or exists(
      select 1 from users ur where ur.id = auth.uid() and ur.role = 'admin'
    )
  );

-- Add policies after you define auth roles in Supabase Auth.