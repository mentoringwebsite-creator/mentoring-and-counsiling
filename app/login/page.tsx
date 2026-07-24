"use client";

import Link from 'next/link';
import { GraduationCap, BriefcaseBusiness, Landmark, Settings2, ArrowLeft } from 'lucide-react';
import { Header } from '@/components/header';

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
        {/* Header */}
        <Header 
          title="Enhancement & Counselling"
          subtitle="Sreenidhi Institute of Science & Technology"
          showBackButton={true}
          backHref="/"
          showUserMenu={false}
        />

        {/* Content */}
        <section className="flex-1 flex items-center justify-center px-4 py-8 md:px-8 md:py-10">
          <div className="w-full max-w-[1000px] rounded-[32px] border border-white/20 bg-white/85 p-6 shadow-[0_40px_120px_rgba(15,23,42,0.22)] backdrop-blur-xl md:p-8">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-4 inline-flex items-center rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-emerald-700 shadow-sm">
                Secure access portal
              </div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900 md:text-4xl">Select Your Login Type</h1>
              <p className="mt-3 text-sm leading-7 text-slate-600 md:text-base">Choose the best option to access your dashboard and institutional tools.</p>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2 md:gap-5">
              {roles.map((role) => {
                const Icon = role.icon;

                return (
                  <Link
                    key={role.label}
                    href={role.href as never}
                    className="group flex min-h-[190px] flex-col items-center justify-center rounded-[24px] border border-slate-200 bg-white px-6 py-7 text-center shadow-sm transition duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-md"
                  >
                    <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 transition duration-300 group-hover:scale-110 group-hover:bg-emerald-100 md:h-20 md:w-20">
                      <Icon className="h-8 w-8 md:h-10 md:w-10" />
                    </div>
                    <h2 className="text-lg font-bold text-slate-900">{role.label}</h2>
                    <p className="mt-2 max-w-[280px] text-sm leading-relaxed text-slate-600">{role.description}</p>
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