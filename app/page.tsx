import Image from 'next/image';
import Link from 'next/link';
import { BadgeCheck, BriefcaseBusiness, GraduationCap, Headphones, ShieldCheck } from 'lucide-react';
import { Brand } from '@/components/brand';
import { PortalButton } from '@/components/portal-button';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="w-full overflow-hidden bg-white">
        <header className="flex flex-col gap-4 border-b border-black/5 bg-white px-5 py-4 md:flex-row md:items-center md:justify-between md:px-8 md:py-5">
          <div className="flex items-center gap-4">
            <Brand />
            <div className="hidden border-l border-black/10 pl-4 text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-[#315d47] md:grid">
              <span>Sreenidhi</span>
              <span>Institute of</span>
              <span>Science and Technology</span>
            </div>
          </div>

          <nav className="flex items-center gap-4 text-sm font-semibold text-[#1d2f29] md:gap-8">
            <Link className="transition hover:text-[#c56b07]" href="#home">Home</Link>
            <Link className="transition hover:text-[#c56b07]" href="#about">About</Link>
            <Link className="transition hover:text-[#c56b07]" href="#contact">Contact</Link>
            <PortalButton href="/login" className="px-6 py-2.5">Login</PortalButton>
          </nav>
        </header>

        <section
          id="home"
          className="relative min-h-[560px] overflow-hidden bg-[linear-gradient(180deg,rgba(18,39,31,0.20),rgba(18,39,31,0.22)),url('https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1600&q=80')] bg-cover bg-center bg-no-repeat"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_40%,rgba(255,255,255,0.12),transparent_24%),radial-gradient(circle_at_88%_18%,rgba(255,255,255,0.08),transparent_16%)]" />
          <div className="relative z-10 mx-auto flex min-h-[560px] max-w-[1180px] items-center px-6 py-12 md:px-10 md:py-16">
            <div className="max-w-[640px] text-white">
              <div className="mb-5 inline-flex items-center gap-3 text-[0.72rem] font-bold uppercase tracking-[0.18em] text-white/85">
                <span className="h-1 w-9 rounded-full bg-white" />
                Student success platform · updated release
              </div>
              <h1 className="max-w-[600px] text-4xl font-extrabold leading-[0.98] tracking-[-0.04em] md:text-[5rem]">
                Empowering Students for a Successful Future
              </h1>
              <p className="mt-6 max-w-[560px] text-base leading-8 text-white/88 md:text-[1.05rem]">
                A refreshed mentoring and counseling platform designed to help every student grow academically, professionally, and personally.
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <PortalButton href="/login" className="px-7 py-4 text-[0.98rem]">Login to Portal</PortalButton>
              </div>
            </div>
          </div>
        </section>

        <section id="about" className="grid gap-8 bg-white px-6 py-10 md:grid-cols-[1.05fr_0.95fr] md:items-center md:px-10 md:py-12">
          <div>
            <h2 className="text-[2.1rem] font-bold tracking-[-0.04em] text-[#1e6b4d]">
              About <span className="text-[#174733]">Our Institution</span>
            </h2>
            <p className="mt-5 max-w-[610px] text-[1.02rem] leading-8 text-[#3c5348]">
              <span className="font-bold text-[#15372d]">Sreenidhi Institute of Science and Technology (SNIST)</span> is a premier autonomous institution dedicated to academic excellence, innovation, and holistic student development. With over 800 students across multiple engineering disciplines, we strive to provide the best mentoring and career guidance.
            </p>
          </div>

          <div className="overflow-hidden rounded-[18px] border border-black/5 shadow-[0_16px_38px_rgba(15,44,34,0.12)]">
            <img
              src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1080&q=80"
              alt="Campus building at Sreenidhi Institute"
              className="h-full w-full object-cover"
            />
          </div>
        </section>

        <section className="border-y border-black/5 bg-[#f6f7f5] px-4 py-4 md:px-6">
          <div className="grid gap-4 md:grid-cols-4">
            {[
              { icon: BadgeCheck, title: 'Mentoring System', text: 'Monitor student performance and progress' },
              { icon: GraduationCap, title: 'Academic Support', text: 'Each student receives guidance from mentors' },
              { icon: BriefcaseBusiness, title: 'Career Development', text: 'Track skills, certifications, and internships' },
              { icon: Headphones, title: 'Counselling Support', text: 'Provide confidential support for well-being' }
            ].map((item) => {
              const Icon = item.icon;

              return (
                <article key={item.title} className="flex items-center gap-4 rounded-[20px] bg-white px-4 py-3 shadow-[0_8px_28px_rgba(16,45,37,0.06)]">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-[#f3ead8] text-[#9b6408]">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-[0.98rem] font-semibold text-[#173a2f]">{item.title}</h3>
                    <p className="mt-1 text-[0.72rem] leading-5 text-[#556b61]">{item.text}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <footer id="contact" className="flex flex-col gap-3 bg-[#1f4650] px-6 py-5 text-white md:flex-row md:items-center md:justify-between md:px-10">
          <span className="text-sm font-semibold">Student Enhancement &amp; Mentoring Portal</span>
          <span className="text-sm text-white/80">© 2024 Sreenidhi Institute of Science and Technology · Contact: support@sreenidhi.edu.in</span>
        </footer>
      </div>
    </main>
  );
}