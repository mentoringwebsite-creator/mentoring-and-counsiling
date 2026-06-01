import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BookOpen, CheckCircle2, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { Brand } from '@/components/brand';
import { PortalButton } from '@/components/portal-button';
import { StatCard } from '@/components/stat-card';

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-5 md:px-6 md:py-6">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[-8rem] top-[-8rem] h-72 w-72 rounded-full bg-[#c7d9cf]/60 blur-3xl" />
        <div className="absolute right-[-6rem] top-[8rem] h-80 w-80 rounded-full bg-[#eadab1]/45 blur-3xl" />
        <div className="absolute bottom-[-8rem] left-1/4 h-80 w-80 rounded-full bg-[#d3e7da]/50 blur-3xl" />
      </div>

      <div className="mx-auto max-w-[1320px] overflow-hidden rounded-[32px] border border-white/70 bg-white/84 shadow-soft backdrop-blur-xl">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-black/5 bg-white/80 px-6 py-4 md:px-8">
          <Brand />
          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-700 md:flex">
            <Link href="#about">About</Link>
            <Link href="#highlights">Highlights</Link>
            <Link href="#contact">Contact</Link>
            <PortalButton href="/login">Login</PortalButton>
          </nav>
        </header>

        <section className="grid gap-10 bg-[linear-gradient(180deg,#eff5f1_0%,#f9fbf9_55%,#ffffff_100%)] px-6 py-10 md:grid-cols-[1.04fr_0.96fr] md:px-10 md:py-14">
          <div className="flex max-w-2xl flex-col justify-center">
            <p className="mb-5 inline-flex w-fit items-center gap-3 rounded-full border border-portal-line bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-portal-moss shadow-[0_8px_24px_rgba(15,44,34,0.06)]">
              <Sparkles className="h-4 w-4 text-portal-gold" />
              Student success portal
            </p>
            <h1 className="max-w-[760px] text-4xl font-semibold tracking-tight text-portal-ink md:text-6xl">
              A calmer portal for mentoring, counseling, and student progress.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-8 text-slate-600 md:text-lg">
              Bring students, faculty, HOD, and admins into one focused workspace with cleaner navigation, better visibility, and less friction.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <PortalButton href="/login">Open Portal</PortalButton>
              <PortalButton href="#highlights" variant="secondary">Explore Features</PortalButton>
            </div>
            <div className="mt-8 flex flex-wrap gap-3 text-sm text-slate-600">
              {['Mentor notes', 'Student profiles', 'Query tracking', 'Progress reports'].map((item) => (
                <span key={item} className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/85 px-4 py-2 shadow-[0_8px_20px_rgba(15,44,34,0.05)]">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  {item}
                </span>
              ))}
            </div>
          </div>
          <div className="grid gap-4">
            <div className="rounded-[30px] border border-portal-line bg-white p-5 shadow-[0_20px_50px_rgba(15,44,34,0.08)] md:p-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <StatCard title="Students" value="All-in-one" hint="Profiles, goals, and support" tone="green" />
                <StatCard title="Faculty" value="Faster" hint="Notes, follow-ups, and queries" tone="orange" />
                <StatCard title="HOD" value="Clear" hint="Reports and oversight" tone="red" />
              </div>
            </div>
            <div className="overflow-hidden rounded-[30px] border border-portal-line bg-[linear-gradient(180deg,#ffffff,#f3f7f4)] p-6 shadow-[0_20px_50px_rgba(15,44,34,0.08)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-portal-gold">Portal preview</div>
                  <div className="mt-2 text-2xl font-semibold text-portal-ink">Clear structure, calmer visual hierarchy</div>
                  <p className="mt-2 max-w-md text-sm leading-7 text-slate-600">A cleaner interface with softer contrast, more breathing room, and stronger signals for action.</p>
                </div>
                <div className="hidden rounded-3xl border border-white/80 bg-white/80 p-3 shadow-[0_12px_28px_rgba(15,44,34,0.08)] sm:block">
                  <Image src="/assets/sreenidhi-logo.png" alt="Sreenidhi logo" width={140} height={46} />
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {[
                  { icon: Users, title: 'Focused audiences', text: 'Separate experiences for students, faculty, HOD, and admin.' },
                  { icon: ShieldCheck, title: 'Clearer oversight', text: 'Keep the important parts visible without crowding the page.' },
                  { icon: BookOpen, title: 'Easy updates', text: 'Log notes, track progress, and revisit conversations quickly.' },
                  { icon: ArrowRight, title: 'Fast next steps', text: 'Strong calls to action help users move into the right portal.' }
                ].map((item) => {
                  const Icon = item.icon;

                  return (
                    <div key={item.title} className="rounded-[22px] border border-white/80 bg-white/90 p-4 shadow-[0_10px_24px_rgba(15,44,34,0.05)]">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-portal-paper text-portal-moss">
                          <Icon className="h-5 w-5" />
                        </span>
                        <div className="text-sm font-semibold text-portal-ink">{item.title}</div>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-slate-600">{item.text}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section id="highlights" className="grid gap-6 px-6 py-10 md:grid-cols-3 md:px-10">
          {[
            {
              title: 'Mentoring made simple',
              text: 'Track guidance sessions, academic updates, and student support without clutter.'
            },
            {
              title: 'Role-based access',
              text: 'Keep student, faculty, and admin experiences focused on what each role needs most.'
            },
            {
              title: 'Clean dashboards',
              text: 'Readable cards, calm colors, and direct actions help users move faster.'
            }
          ].map((item, index) => (
            <article key={item.title} className="portal-card relative overflow-hidden">
              <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-[#dce9df] blur-2xl" />
              <div className="relative">
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-portal-paper text-portal-moss">
                  <span className="text-base font-semibold">0{index + 1}</span>
                </div>
                <h2 className="text-xl font-semibold text-portal-ink">{item.title}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.text}</p>
              </div>
            </article>
          ))}
        </section>

        <section id="about" className="px-6 pb-10 md:px-10">
          <div className="portal-card flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-portal-ink">Built for a calmer workflow</h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
                The portal keeps the interface light and structured so students and staff can focus on conversations, progress, and support.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <PortalButton href="/login">Sign In</PortalButton>
              <PortalButton href="#highlights" variant="secondary">Review Highlights</PortalButton>
            </div>
          </div>
        </section>

        <footer id="contact" className="flex flex-wrap items-center justify-between gap-4 border-t border-black/5 bg-[linear-gradient(90deg,#23443a_0%,#1e362f_100%)] px-6 py-5 text-white md:px-10">
          <span className="font-medium">Student mentoring and counseling portal</span>
          <span className="text-white/80">support@sreenidhi.edu.in</span>
        </footer>
      </div>
    </main>
  );
}