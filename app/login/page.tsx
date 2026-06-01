"use client";

import Link from 'next/link';
import { GraduationCap, BriefcaseBusiness, Landmark, Settings2 } from 'lucide-react';
import { Brand } from '@/components/brand';

const roles = [
  { label: 'Student / Parent Login', href: '/student', description: 'View academic progress, attendance, and mentoring details.', icon: GraduationCap },
  { label: 'Faculty Login', href: '/faculty', description: 'Access mentoring dashboard and monitor assigned students.', icon: BriefcaseBusiness },
  { label: 'HOD Login', href: '/hod', description: 'View department analytics and mentor activity reports.', icon: Landmark },
  { label: 'Admin Login', href: '/admin', description: 'Manage portal data and institutional analytics.', icon: Settings2 }
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

        <section className="relative overflow-hidden px-5 py-10 md:px-8 md:py-12">
          <div className="absolute inset-0 bg-white/72" />
          <div className="relative z-10 mx-auto flex max-w-[1120px] flex-col gap-8">
            <div>
              <h1 className="text-center text-[2rem] font-extrabold tracking-[-0.04em] text-[#1d2a39] md:text-[2.7rem]">Select Your Login Type</h1>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {roles.map((role) => {
                const Icon = role.icon;

                return (
                  <Link
                    key={role.label}
                    href={role.href as never}
                    className="group flex min-h-[194px] flex-col items-center justify-center rounded-[10px] border border-[#dde3e6] bg-white p-8 text-center shadow-[0_6px_18px_rgba(18,39,31,0.08)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(18,39,31,0.12)]"
                  >
                    <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-[#dbe8e1] text-[#27584a] transition group-hover:bg-[#cfe0d8]">
                      <Icon className="h-10 w-10" />
                    </div>
                    <h2 className="text-[1.18rem] font-semibold text-[#1f2b36] md:text-[1.28rem]">{role.label}</h2>
                    <p className="mt-2 max-w-[290px] text-[0.98rem] leading-7 text-[#66747b]">{role.description}</p>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <footer className="flex flex-col gap-3 bg-[#173b34] px-5 py-5 text-white md:flex-row md:items-center md:justify-between md:px-8">
          <span className="text-sm font-semibold">© Sreenidhi Institute of Science and Technology</span>
          <span className="text-sm">Student Enhancement &amp; Counselling Portal</span>
          <span className="text-sm text-white/80">Contact: support@sreenidhi.edu.in</span>
        </footer>
      </div>
    </main>
  );
}