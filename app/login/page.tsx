"use client";

import Link from 'next/link';
import { GraduationCap, BriefcaseBusiness, Landmark, Settings2, ArrowLeft } from 'lucide-react';
import { Header } from '@/components/header';

const roles = [
  { label: 'Student / Parent Login', href: '/student/login', description: 'View academic progress, attendance, and mentoring details.', icon: GraduationCap },
  { label: 'Faculty Login', href: '/faculty/login', description: 'Access mentoring dashboard and monitor assigned students.', icon: BriefcaseBusiness },
  { label: 'HOD Login', href: '/hod/login', description: 'View department analytics and mentor activity reports.', icon: Landmark },
  { label: 'Admin Login', href: '/admin/login', description: 'Manage portal data and institutional analytics.', icon: Settings2 }
];

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <Header 
          title="Enhancement & Counselling"
          subtitle="Sreenidhi Institute of Science & Technology"
          showBackButton={true}
          backHref="/"
          showUserMenu={false}
        />

        {/* Content */}
        <section className="flex-1 flex flex-col justify-center px-5 py-10 md:px-8 md:py-14 animate-fade-in">
          <div className="mx-auto flex w-full max-w-[1180px] flex-col justify-center gap-10">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-4 inline-flex items-center rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-emerald-700 shadow-sm">
                Secure access portal
              </div>
              <h1 className="text-center text-[2rem] font-black tracking-tight text-slate-900 md:text-[2.7rem]">Select Your Login Type</h1>
              <p className="mt-4 text-center text-sm leading-7 text-slate-600 md:text-base">Choose the best option to access your dashboard and institutional tools.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 md:gap-6 xl:gap-7 animate-scale-in">
              {roles.map((role) => {
                const Icon = role.icon;

                return (
                  <Link
                    key={role.label}
                    href={role.href as never}
                    className="group flex min-h-[224px] flex-col items-center justify-center rounded-[16px] border border-slate-200 bg-white px-8 py-10 text-center shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-md md:min-h-[238px]"
                  >
                    <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 transition-all duration-300 group-hover:scale-110 group-hover:bg-emerald-100 md:h-[88px] md:w-[88px]">
                      <Icon className="h-10 w-10 md:h-12 md:w-12" />
                    </div>
                    <h2 className="text-[1.2rem] font-bold text-slate-900 md:text-[1.32rem]">{role.label}</h2>
                    <p className="mt-3 max-w-[310px] text-[0.95rem] leading-relaxed text-slate-600">{role.description}</p>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="flex flex-col gap-2 border-t border-slate-200 bg-white px-5 py-6 text-slate-600 md:flex-row md:items-center md:justify-between md:px-8">
          <span className="text-sm font-semibold text-slate-800">© Sreenidhi Institute of Science and Technology</span>
          <span className="text-sm font-medium">Student Enhancement &amp; Counselling Portal</span>
          <span className="text-sm">Contact: support@sreenidhi.edu.in</span>
        </footer>
      </div>
    </main>
  );
}