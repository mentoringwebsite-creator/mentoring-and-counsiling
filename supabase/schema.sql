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

-- Add policies after you define auth roles in Supabase Auth.