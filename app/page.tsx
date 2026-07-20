import { BadgeCheck, BriefcaseBusiness, GraduationCap, Headphones, ShieldCheck } from 'lucide-react';
import { Brand } from '@/components/brand';
import { PortalButton } from '@/components/portal-button';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="w-full overflow-hidden bg-white">
        <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/95 backdrop-blur-xl px-5 py-4 shadow-sm md:px-8">
          <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Brand />
              <div className="hidden border-l border-slate-200 pl-4 text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-[#315d47] md:grid">
                <span>Sreenidhi</span>
                <span>Institute of</span>
                <span>Science and Technology</span>
              </div>
            </div>

            <nav className="hidden items-center gap-6 text-sm font-semibold text-[#1d2f29] md:flex">
              <a className="transition hover:text-[#c56b07]" href="#home">Home</a>
              <a className="transition hover:text-[#c56b07]" href="#about">About</a>
              <a className="transition hover:text-[#c56b07]" href="#contact">Contact</a>
              <PortalButton href="/login" className="px-6 py-2.5">Login</PortalButton>
            </nav>
          </div>
        </header>

        <section
          id="home"
          className="relative overflow-hidden bg-[url('/assets/college-bg.jpg')] bg-cover bg-center bg-no-repeat"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(22,101,52,0.8),transparent_40%),linear-gradient(180deg,rgba(2,12,8,0.7),rgba(6,35,25,0.95))]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.1),transparent_25%)]" />
          <div className="relative z-10 mx-auto flex min-h-[680px] max-w-[1180px] items-center px-6 py-16 md:px-10">
            <div className="max-w-[660px] text-white">
              <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-900/40 px-4 py-2 text-[0.7rem] font-bold uppercase tracking-[0.25em] text-emerald-100 backdrop-blur-md shadow-lg">
                <BadgeCheck className="h-4 w-4 text-emerald-300" /> Trusted mentoring for every student
              </span>

              <h1 className="text-4xl font-extrabold leading-[1.1] tracking-[-0.03em] md:text-[4.75rem] md:leading-[1.02] drop-shadow-lg">
                Empowering students with <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-100">mentoring, counseling,</span> and career guidance.
              </h1>

              <p className="mt-6 max-w-[610px] text-base leading-8 text-slate-300 md:text-lg font-medium">
                A modern portal for SNIST students, faculty, and administrators to track progress, connect with mentors, and access confidential support across academics and careers.
              </p>

              <div className="mt-10 flex flex-wrap gap-4">
                <PortalButton href="/login" className="px-8 py-4 text-[1rem] bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all">Open Portal</PortalButton>
                <PortalButton href="#about" variant="secondary" className="px-8 py-4 text-[1rem] bg-white/10 hover:bg-white/20 border-white/20 text-white backdrop-blur-md">See Details</PortalButton>
              </div>

              <div className="mt-12 grid gap-4 sm:grid-cols-3">
                <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 text-sm shadow-xl backdrop-blur-md hover:bg-white/10 transition-colors">
                  <div className="text-3xl font-black text-emerald-300">800+</div>
                  <div className="mt-1 uppercase tracking-[0.15em] text-slate-300 font-semibold text-xs">Students supported</div>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 text-sm shadow-xl backdrop-blur-md hover:bg-white/10 transition-colors">
                  <div className="text-3xl font-black text-emerald-300">24/7</div>
                  <div className="mt-1 uppercase tracking-[0.15em] text-slate-300 font-semibold text-xs">Counseling access</div>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 text-sm shadow-xl backdrop-blur-md hover:bg-white/10 transition-colors">
                  <div className="text-3xl font-black text-emerald-300">98%</div>
                  <div className="mt-1 uppercase tracking-[0.15em] text-slate-300 font-semibold text-xs">Mentor satisfaction</div>
                </div>
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

        <section className="bg-[linear-gradient(180deg,#f7f8f6,#f1f3f2)] px-6 py-8 md:px-10">
          <div className="mx-auto max-w-[1180px]">
            <div className="grid gap-6 md:grid-cols-4">
              {[
                { icon: BadgeCheck, title: 'Mentoring System', text: 'Monitor student performance and progress' },
                { icon: GraduationCap, title: 'Academic Support', text: 'Each student receives guidance from mentors' },
                { icon: BriefcaseBusiness, title: 'Career Development', text: 'Track skills, certifications, and internships' },
                { icon: Headphones, title: 'Counselling Support', text: 'Provide confidential support for well-being' }
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <article key={item.title} className="rounded-2xl bg-white p-6 shadow-[0_18px_40px_rgba(18,39,31,0.06)]">
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#fbf3e6] text-[#b8832e] shadow-sm">
                        <Icon className="h-7 w-7" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-[#173a2f]">{item.title}</h3>
                        <p className="mt-1 text-sm leading-6 text-[#556b61]">{item.text}</p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section aria-labelledby="trust" className="border-t border-black/5 bg-white px-6 py-6 md:px-10">
          <div className="mx-auto max-w-[1180px]">
            <div className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#fff3e6] text-[#b86d00] font-bold">A+</div>
                  <div className="text-sm font-semibold">NBA Accredited</div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e8f7ef] text-[#1f7a58]">📘</div>
                  <div className="text-sm font-semibold">Mentoring System</div>
                </div>

                <div className="flex items-center gap-3 hidden md:flex">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#eef3ff] text-[#23558c]">🎓</div>
                  <div className="text-sm font-semibold">Career Development</div>
                </div>
              </div>

              <div className="hidden md:block text-sm text-slate-600">Monitor student performance, receive mentor guidance, and access counseling support.</div>
            </div>
          </div>
        </section>

        <footer id="contact" className="bg-gradient-to-b from-[#0f3b46] to-[#173b4a] px-6 py-8 text-white">
          <div className="mx-auto flex max-w-[1180px] flex-col items-center gap-4 md:flex-row md:items-center md:justify-between">
            <div className="text-center md:text-left">
              <div className="text-sm font-semibold">Student Enhancement &amp; Mentoring Portal</div>
              <div className="mt-1 text-sm text-white/80">© 2024 Sreenidhi Institute of Science and Technology · Contact: support@sreenidhi.edu.in</div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3 text-sm text-white/90">
                <ShieldCheck className="h-5 w-5" /> <span>Secure &amp; Private</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-white/90">
                <BadgeCheck className="h-5 w-5" /> <span>Trusted by students</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}