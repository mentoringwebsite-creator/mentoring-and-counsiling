'use client';

import { BadgeCheck, ShieldCheck } from 'lucide-react';
import { PortalButton } from '@/components/portal-button';
import { Header } from '@/components/header';
import { Brand } from '@/components/brand';

const heroImage = '/assets/college-bg-1 .png';
const aboutImage = '/assets/college-bg-2 .png';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background font-sans selection:bg-emerald-100 selection:text-emerald-900">
      <div className="w-full overflow-hidden">
        <div className="fixed top-0 left-0 right-0 z-50 w-full">
          <Header
            showBackButton={false}
            showUserMenu={false}
            rightElement={
              <nav className="hidden items-center gap-8 text-[13px] font-bold uppercase tracking-wider text-slate-700 md:flex">
                <a className="hover:text-emerald-700 transition-colors" href="#home">HOME</a>
                <a className="hover:text-emerald-700 transition-colors" href="#about">ABOUT</a>
                <PortalButton href="/login" className="px-6 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold tracking-wider text-[11px] uppercase transition-all shadow-md">
                  LOGIN TO PORTAL
                </PortalButton>
              </nav>
            }
          />
        </div>

        <section id="home" className="relative pt-[72px]">
          <div className="relative h-[calc(100vh-72px)]">
            <img
              src={heroImage}
              alt="SNIST campus"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-slate-950/55" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/30 to-transparent" />

            <div className="relative z-10 mx-auto flex h-full max-w-[1300px] items-center px-6 py-16 md:px-12">
              <div className="max-w-2xl text-white">
                <p className="inline-flex items-center rounded-full border border-white/15 bg-amber-500/15 px-4 py-2 text-sm font-semibold uppercase tracking-[0.24em] text-amber-100 shadow-sm shadow-black/10">
                  Empowering Students for Success
                </p>
                <h1 className="mt-8 text-4xl font-black tracking-tight text-white sm:text-5xl md:text-6xl lg:text-[4.5rem] leading-[1.02]">
                  Empowering Students for a Successful Future
                </h1>
                <p className="mt-6 max-w-xl text-base leading-8 text-slate-100/90 sm:text-lg">
                  A mentoring and counseling platform designed to help every student grow academically, professionally, and personally.
                </p>
                <div className="mt-10 flex flex-wrap gap-4">
                  <PortalButton href="/login" className="rounded-full bg-amber-500 px-7 py-3 text-sm font-semibold text-white shadow-xl shadow-amber-500/30 hover:bg-amber-400">
                    Login to Portal
                  </PortalButton>
                  <PortalButton href="#about" variant="secondary" className="rounded-full px-7 py-3 text-sm font-semibold">
                    Learn More
                  </PortalButton>
                </div>

                <div className="mt-14 flex flex-wrap gap-8 text-sm text-white/85">
                  <div>
                    <div className="text-3xl font-black text-amber-300">800+</div>
                    <div className="mt-2 uppercase tracking-[0.24em] text-slate-200">Students Supported</div>
                  </div>
                  <div>
                    <div className="text-3xl font-black text-amber-300">24/7</div>
                    <div className="mt-2 uppercase tracking-[0.24em] text-slate-200">Counseling Access</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="about" className="bg-slate-50 py-24 px-6 md:px-12">
          <div className="mx-auto grid max-w-[1300px] gap-12 lg:grid-cols-[1.2fr_0.8fr] items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm">
                <BadgeCheck className="h-4 w-4 text-emerald-700" />
                <span>About Our Institution</span>
              </div>
              <h2 className="mt-6 text-3xl font-black text-slate-900 sm:text-4xl">
                About Our Institution
              </h2>
              <p className="mt-6 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
                Sreenidhi Institute of Science and Technology (SNIST) is a premier autonomous institution dedicated to academic excellence, innovation, and holistic student development. With over 800 students across multiple engineering disciplines, we strive to provide the best mentoring and career guidance.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="text-3xl font-black text-emerald-700">20+</div>
                  <div className="mt-2 text-sm uppercase tracking-[0.24em] text-slate-500">Expert Mentors</div>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="text-3xl font-black text-emerald-700">95%</div>
                  <div className="mt-2 text-sm uppercase tracking-[0.24em] text-slate-500">Student Satisfaction</div>
                </div>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_20px_80px_rgba(15,23,42,0.08)]">
              <img
                src={aboutImage}
                alt="SNIST campus"
                className="h-full w-full object-cover object-center"
              />
            </div>
          </div>
        </section>

        <footer className="bg-white py-10 px-6 md:px-12 border-t border-slate-200">
          <div className="mx-auto flex max-w-[1280px] flex-col items-center justify-between gap-5 md:flex-row">
            <div className="flex items-center gap-3">
              <Brand />
              <div className="text-sm font-bold text-slate-800">
                Sreenidhi Institute of Science & Technology
              </div>
            </div>

            <div className="text-sm font-medium text-slate-500">
              © {new Date().getFullYear()} SNIST. All rights reserved.
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-600">
              <span className="flex items-center gap-2 font-bold text-slate-600">
                <ShieldCheck className="h-4 w-4 text-emerald-600" /> Secure
              </span>
              <span className="flex items-center gap-2 font-bold text-slate-600">
                <BadgeCheck className="h-4 w-4 text-emerald-600" /> Trusted
              </span>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
