"use client";

import Image from 'next/image';
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
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="min-h-screen flex flex-col">
        <div className="border-b border-slate-200 bg-white/95 backdrop-blur-sm">
          <div className="mx-auto flex max-w-[1180px] items-center justify-between px-5 py-4 md:px-8">
            <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
            <div className="hidden items-center gap-4 md:flex">
              <div className="flex items-center gap-3 rounded-full bg-slate-100 px-4 py-2">
                <Image src="/assets/sreenidhi-logo.png" alt="SNIST Logo" width={96} height={32} className="h-8 w-auto object-contain" />
              </div>
              <div className="rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Secure Access Portal
              </div>
            </div>
          </div>
        </div>

        <section className="flex-1 flex flex-col justify-center px-5 py-10 md:px-8 md:py-14">
          <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-10">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-5 inline-flex items-center rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-emerald-700 shadow-sm">
                Secure access portal
              </div>
              <h1 className="text-center text-[2.4rem] font-black tracking-tight text-slate-900 md:text-[3rem]">Select Your Login Type</h1>
              <p className="mt-4 text-center text-sm leading-7 text-slate-600 md:text-base">Choose the best option to access your dashboard and institutional tools.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:gap-8">
              {roles.map((role) => {
                const Icon = role.icon;

                return (
                  <Link
                    key={role.label}
                    href={role.href as never}
                    className="group flex min-h-[250px] flex-col justify-center rounded-[28px] border border-slate-200 bg-white px-8 py-12 text-center shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-md"
                  >
                    <div className="mb-6 flex h-[96px] w-[96px] items-center justify-center rounded-[28px] bg-emerald-50 text-emerald-600 transition-all duration-300 group-hover:scale-110 group-hover:bg-emerald-100">
                      <Icon className="h-12 w-12" />
                    </div>
                    <h2 className="text-[1.35rem] font-bold text-slate-900">{role.label}</h2>
                    <p className="mt-4 max-w-[320px] mx-auto text-sm leading-7 text-slate-600">{role.description}</p>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <footer className="border-t border-slate-200 bg-white px-5 py-6 text-slate-600 md:px-8">
          <div className="mx-auto flex max-w-[1180px] flex-col gap-3 text-sm md:flex-row md:items-center md:justify-between">
            <span className="font-semibold text-slate-800">© Sreenidhi Institute of Science and Technology</span>
            <span className="font-medium">Student Enhancement &amp; Counselling Portal</span>
            <span>Contact: support@sreenidhi.edu.in</span>
          </div>
        </footer>
      </div>
    </main>
  );
}
