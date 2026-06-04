"use client";

import Link from 'next/link';
import { GraduationCap, BriefcaseBusiness, Landmark, Settings2 } from 'lucide-react';
import { Brand } from '@/components/brand';

const roles = [
  { label: 'Student / Parent Login', href: '/student/login', description: 'View academic progress, attendance, and mentoring details.', icon: GraduationCap },
  { label: 'Faculty Login', href: '/faculty/login', description: 'Access mentoring dashboard and monitor assigned students.', icon: BriefcaseBusiness },
  { label: 'HOD Login', href: '/hod/login', description: 'View department analytics and mentor activity reports.', icon: Landmark },
  { label: 'Admin Login', href: '/admin/login', description: 'Manage portal data and institutional analytics.', icon: Settings2 }
];

export default function LoginPage() {
  return (
    <main
      className="min-h-screen bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(241,245,242,0.9))]"
      style={{ backgroundImage: "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(241,245,242,0.9)), url('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1600&q=80')", backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      <div className="min-h-screen bg-[rgba(255,255,255,0.72)] backdrop-blur-[2px]">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-black/5 bg-white px-5 py-4 md:px-8 md:py-5">
          <div className="flex items-center gap-4">
            <Brand compact />
            <div className="hidden border-l border-black/10 pl-4 md:block">
              <div className="text-[1.02rem] font-semibold uppercase tracking-[0.12em] text-portal-ink">Student Enhancement &amp; Counselling Portal</div>
              <div className="text-sm text-slate-600">Sreenidhi Institute of Science and Technology</div>
            </div>
          </div>
        </header>

        <section className="relative overflow-hidden px-5 py-10 md:px-8 md:py-14">
          <div className="absolute inset-0 bg-white/72" />
          <div className="relative z-10 mx-auto flex min-h-[calc(100vh-14rem)] max-w-[1180px] flex-col justify-center gap-10">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-4 inline-flex items-center rounded-full border border-[#d4ded8] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#45685d] shadow-[0_8px_20px_rgba(18,39,31,0.05)]">
                Secure access portal
              </div>
              <h1 className="text-center text-[2rem] font-extrabold tracking-[-0.04em] text-[#1d2a39] md:text-[2.7rem]">Select Your Login Type</h1>
              <p className="mt-3 text-center text-sm leading-7 text-slate-600 md:text-base">Choose the best option to access your dashboard and institutional tools.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 md:gap-6 xl:gap-7">
              {roles.map((role) => {
                const Icon = role.icon;

                return (
                  <Link
                    key={role.label}
                    href={role.href as never}
                    className="group flex min-h-[224px] flex-col items-center justify-center rounded-[12px] border border-[#dde3e6] bg-white px-8 py-10 text-center shadow-[0_6px_18px_rgba(18,39,31,0.08)] transition duration-200 hover:-translate-y-1 hover:border-[#c9d7d0] hover:shadow-[0_18px_45px_rgba(18,39,31,0.12)] md:min-h-[238px]"
                  >
                    <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-[#dbe8e1] text-[#27584a] transition group-hover:bg-[#cfe0d8] md:h-[88px] md:w-[88px]">
                      <Icon className="h-11 w-11 md:h-12 md:w-12" />
                    </div>
                    <h2 className="text-[1.2rem] font-semibold text-[#1f2b36] md:text-[1.32rem]">{role.label}</h2>
                    <p className="mt-2 max-w-[310px] text-[0.98rem] leading-7 text-[#66747b]">{role.description}</p>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <footer className="flex flex-col gap-2 bg-[#173b34] px-5 py-5 text-white md:flex-row md:items-center md:justify-between md:px-8">
          <span className="text-sm font-semibold">© Sreenidhi Institute of Science and Technology</span>
          <span className="text-sm">Student Enhancement &amp; Counselling Portal</span>
          <span className="text-sm text-white/80">Contact: support@sreenidhi.edu.in</span>
        </footer>
      </div>
    </main>
  );
}