"use client";

import Link from 'next/link';
import { GraduationCap, BriefcaseBusiness, Landmark, Settings2, ArrowLeft } from 'lucide-react';

const roles = [
  { label: 'Student / Parent Login', href: '/student/login', description: 'View academic progress, attendance, and mentoring details.', icon: GraduationCap },
  { label: 'Mentor Login', href: '/faculty/login', description: 'Access mentoring dashboard and monitor assigned students.', icon: BriefcaseBusiness },
  { label: 'HOD Login', href: '/hod/login', description: 'View department analytics and mentor activity reports.', icon: Landmark },
  { label: 'Admin / Dean Login', href: '/admin/login', description: 'Manage portal data and institutional analytics.', icon: Settings2 }
];

export default function LoginPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-900">
      <img
        src="/assets/college-bg-3.png"
        alt="Campus background"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
      />
      <div className="pointer-events-none absolute inset-0 bg-slate-950/55 backdrop-blur-sm" />
      <div className="pointer-events-none absolute left-[-4rem] top-[10%] h-80 w-80 rounded-full bg-emerald-400/15 blur-3xl" />
      <div className="pointer-events-none absolute right-[-4rem] top-[40%] h-80 w-80 rounded-full bg-cyan-400/15 blur-3xl" />

      <div className="relative z-10 flex min-h-screen flex-col">
        {/* Centered hero-style login tiles */}
        <section className="flex-1 flex items-center justify-center px-4 py-12 md:px-8">
          <div className="w-full max-w-[980px]">
            <div className="mx-auto text-center mb-8">
              <h1 className="text-3xl font-black tracking-tight text-slate-900 md:text-4xl">Select Your Login Type</h1>
              <p className="mt-2 text-sm text-slate-700">Choose the best option to access your dashboard and institutional tools.</p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {roles.map((role) => {
                const Icon = role.icon;

                return (
                  <Link
                    key={role.label}
                    href={role.href as never}
                    className="group flex min-h-[150px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white/95 px-6 py-6 text-center shadow-lg transition-transform duration-200 hover:-translate-y-1 hover:shadow-2xl"
                  >
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 transition duration-300 group-hover:scale-105 md:h-18 md:w-18">
                      <Icon className="h-8 w-8 md:h-10 md:w-10" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">{role.label}</h2>
                    <p className="mt-2 max-w-[300px] text-sm leading-relaxed text-slate-600">{role.description}</p>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/20 bg-white/70 px-5 py-5 text-slate-800/90 backdrop-blur-xl md:px-8">
          <div className="mx-auto flex max-w-[1000px] flex-col gap-2 text-center text-sm md:flex-row md:items-center md:justify-between md:text-left">
            <span className="font-semibold">© Sreenidhi Institute of Science and Technology</span>
            <span>Student Enhancement &amp; Counselling Portal</span>
            <span>Contact: support@sreenidhi.edu.in</span>
          </div>
        </footer>
      </div>
    </main>
  );
}