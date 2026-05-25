import Image from 'next/image';
import Link from 'next/link';
import { Brand } from '@/components/brand';
import { PortalButton } from '@/components/portal-button';
import { StatCard } from '@/components/stat-card';

export default function HomePage() {
  return (
    <main className="min-h-screen px-4 py-5 md:px-6 md:py-6">
      <div className="mx-auto max-w-[1320px] overflow-hidden rounded-[32px] border border-white/70 bg-white/90 shadow-soft backdrop-blur">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-black/5 bg-white/90 px-6 py-4 md:px-8">
          <Brand />
          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-700 md:flex">
            <Link href="#about">About</Link>
            <Link href="#highlights">Highlights</Link>
            <Link href="#contact">Contact</Link>
            <PortalButton href="/login">Login</PortalButton>
          </nav>
        </header>

        <section className="grid gap-8 bg-[linear-gradient(180deg,#eff5f1_0%,#ffffff_100%)] px-6 py-10 md:grid-cols-[1.04fr_0.96fr] md:px-10 md:py-14">
          <div className="flex max-w-2xl flex-col justify-center">
            <p className="mb-5 inline-flex w-fit items-center gap-3 rounded-full border border-portal-line bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-portal-moss shadow-[0_8px_24px_rgba(15,44,34,0.06)]">
              Student success portal
            </p>
            <h1 className="max-w-[760px] text-4xl font-semibold tracking-tight text-portal-ink md:text-6xl">
              Simple mentoring, clear guidance, better outcomes.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-8 text-slate-600 md:text-lg">
              A clean, role-based portal for students, faculty, and administrators to manage mentoring, counseling, and academic support in one place.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <PortalButton href="/login">Open Portal</PortalButton>
              <PortalButton href="#highlights" variant="secondary">Explore Features</PortalButton>
            </div>
          </div>
          <div className="grid gap-4">
            <div className="rounded-[28px] border border-portal-line bg-white p-5 shadow-[0_20px_50px_rgba(15,44,34,0.08)] md:p-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <StatCard title="Students" value="1 place" hint="Profiles, progress, and support" tone="green" />
                <StatCard title="Faculty" value="Fast" hint="Notes, follow-ups, and queries" tone="orange" />
                <StatCard title="HOD" value="Clear" hint="Reports and oversight" tone="red" />
              </div>
            </div>
            <div className="overflow-hidden rounded-[28px] border border-portal-line bg-[linear-gradient(180deg,#ffffff,#f5f8f6)] p-6 shadow-[0_20px_50px_rgba(15,44,34,0.08)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-portal-gold">Portal preview</div>
                  <div className="mt-2 text-2xl font-semibold text-portal-ink">Focused, readable, and easy to use</div>
                  <p className="mt-2 max-w-md text-sm leading-7 text-slate-600">A calmer interface with fewer distractions, smoother navigation, and clearer calls to action.</p>
                </div>
                <div className="hidden rounded-2xl bg-portal-paper p-3 sm:block">
                  <Image src="/assets/sreenidhi-logo.png" alt="Sreenidhi logo" width={140} height={46} />
                </div>
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
          ].map((item) => (
            <article key={item.title} className="portal-card">
              <h2 className="text-xl font-semibold text-portal-ink">{item.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{item.text}</p>
            </article>
          ))}
        </section>

        <section id="about" className="px-6 pb-10 md:px-10">
          <div className="portal-card flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-portal-ink">Built for a calmer workflow</h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
                The portal keeps the interface light and structured so students and staff can focus on conversations, progress, and support.
              </p>
            </div>
            <PortalButton href="/login">Sign In</PortalButton>
          </div>
        </section>

        <footer id="contact" className="flex flex-wrap items-center justify-between gap-4 border-t border-black/5 bg-[#23443a] px-6 py-5 text-white md:px-10">
          <span className="font-medium">Student mentoring and counseling portal</span>
          <span className="text-white/80">support@sreenidhi.edu.in</span>
        </footer>
      </div>
    </main>
  );
}