import Image from 'next/image';
import Link from 'next/link';
import { Brand } from '@/components/brand';
import { PortalButton } from '@/components/portal-button';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f4f7f4_0%,#edf2ee_100%)] p-4 md:p-6">
      <div className="mx-auto max-w-[1400px] overflow-hidden rounded-[36px] border border-[rgba(93,119,108,0.14)] bg-white shadow-soft">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-black/5 bg-white/95 px-6 py-4 md:px-8">
          <Brand />
          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-700 md:flex">
            <Link href="#about">Home</Link>
            <Link href="#about">About</Link>
            <Link href="#contact">Contact</Link>
            <PortalButton href="/login">Login</PortalButton>
          </nav>
        </header>

        <section className="grid min-h-[680px] gap-8 px-6 py-10 md:grid-cols-[1.05fr_0.95fr] md:px-10 md:py-14" style={{ backgroundImage: "linear-gradient(180deg, rgba(22,43,36,0.32), rgba(22,43,36,0.08)), url('https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1600&q=80')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
          <div className="flex max-w-2xl flex-col justify-center text-white">
            <p className="mb-5 inline-flex w-fit items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/85 before:h-1 before:w-10 before:rounded-full before:bg-white/90 before:content-['']">Student Success Platform</p>
            <h1 className="max-w-[760px] text-5xl font-extrabold leading-[1.05] md:text-6xl">Empowering Students for a Successful Future</h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-white/92">A mentoring and counseling platform designed to help every student grow academically, professionally, and personally.</p>
            <div className="mt-8 flex flex-wrap gap-4">
              <PortalButton href="/login">Login to Portal</PortalButton>
              <PortalButton href="/student/queries" variant="secondary">View Queries</PortalButton>
            </div>
          </div>
          <div className="hidden items-end justify-end md:flex">
            <div className="relative h-full w-full max-w-[540px] overflow-hidden rounded-[32px] border border-white/30 bg-white/10 shadow-soft backdrop-blur">
              <Image src="/assets/sreenidhi-logo.png" alt="Portal preview" fill className="object-contain object-center p-10 opacity-20" />
              <div className="absolute inset-x-6 bottom-6 rounded-3xl bg-white/90 p-5 text-portal-ink shadow-soft">
                <div className="text-sm font-semibold uppercase tracking-[0.18em] text-portal-gold">Portal Preview</div>
                <div className="mt-1 text-2xl font-bold">ERP-style mentoring dashboards</div>
                <p className="mt-2 text-sm text-slate-600">Login, analytics, queries, and role-based access built for a modern college ERP.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="about" className="grid gap-8 px-6 py-10 md:grid-cols-[1.1fr_0.9fr] md:px-10">
          <div className="portal-card">
            <h2 className="text-3xl font-semibold text-portal-moss">About Our Institution</h2>
            <p className="mt-4 text-lg leading-8 text-slate-700"><strong>Sreenidhi Institute of Science and Technology</strong> is a premier autonomous institution dedicated to academic excellence, innovation, and holistic student development. The portal centralizes student mentoring, counseling, academic tracking, and department analytics.</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {['Mentoring System', 'Counseling Support', 'Career Development', 'Realtime Analytics'].map((item) => (
                <div key={item} className="rounded-2xl bg-portal-paper p-4 text-sm font-semibold text-portal-ink">{item}</div>
              ))}
            </div>
          </div>
          <div className="portal-card overflow-hidden p-0">
            <div className="grid h-full place-items-center bg-[linear-gradient(180deg,#ffffff,#f5f8f6)] p-6">
              <Image src="/assets/sreenidhi-logo.png" alt="Sreenidhi campus" width={700} height={420} className="rounded-3xl object-contain" />
            </div>
          </div>
        </section>

        <footer id="contact" className="flex flex-wrap items-center justify-between gap-4 border-t border-white/70 bg-[#24495b] px-6 py-5 text-white md:px-10">
          <span className="font-medium">Student Enhancement & Mentoring Portal</span>
          <span className="text-white/85">Contact: support@sreenidhi.edu.in</span>
        </footer>
      </div>
    </main>
  );
}