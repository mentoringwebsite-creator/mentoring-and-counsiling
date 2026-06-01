# Sreenidhi Student Counselling Portal

Next.js + Tailwind CSS full-stack rewrite of the mentoring and counselling portal.

## Stack

- Frontend: Next.js App Router
- Styling: Tailwind CSS
- Backend: Supabase
- Database: PostgreSQL in Supabase
- Authentication: Supabase Auth
- Charts: Recharts
- Hosting: Vercel

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create your environment file:

```bash
copy .env.local.example .env.local
```

3. Add your Supabase URL and anon key to `.env.local`.

4. Run the app:

```bash
npm run dev
```

5. Build for production:

```bash
npm run build
```

## Supabase

- Run `supabase/schema.sql` in the SQL editor.
- Create Auth users for student, faculty, HOD, and admin roles.
- Connect storage buckets for resumes, certificates, and profile images.

## Pages

- `/` Home
- `/login` Login + role selection
- `/student` Student dashboard
- `/student/academic` Academic profile
- `/student/extracurricular` Extracurricular activities
- `/student/queries` Query tracker
- `/faculty` Faculty dashboard
- `/faculty/students` Assigned students
- `/faculty/queries` Student queries
- `/faculty/notes` Mentor notes
- `/hod` HOD analytics
- `/admin` Admin overview

## Deployment

Push to GitHub, import the repo in Vercel, add the Supabase environment variables, and deploy.

# SNIST-Mentoring-and-Counselling

## Run locally

- Open `index.html` in a browser, or run a local HTTP server from this folder:

```powershell
python -m http.server 8000
```

Then visit http://localhost:8000 in your browser.afif
