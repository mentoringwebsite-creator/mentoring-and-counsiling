import { BadgeCheck, BriefcaseBusiness, GraduationCap, Headphones, ShieldCheck } from 'lucide-react';
import { Brand } from '@/components/brand';
import { PortalButton } from '@/components/portal-button';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#f8fafc] font-sans selection:bg-emerald-200">
      <div className="w-full overflow-hidden">
        
        {/* Navigation */}
        <header className="fixed top-0 z-50 w-full border-b border-slate-200/50 bg-white/80 backdrop-blur-xl transition-all">
          <div className="mx-auto flex h-20 max-w-[1280px] items-center justify-between px-6 md:px-12">
            <div className="flex items-center gap-4">
              <Brand />
              <div className="hidden border-l-2 border-emerald-100 pl-4 md:block">
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-900 leading-tight">Sreenidhi</div>
                <div className="text-[8px] font-bold uppercase tracking-[0.2em] text-slate-500">Institute of Science & Technology</div>
              </div>
            </div>

            <nav className="hidden items-center gap-8 text-[13px] font-bold uppercase tracking-wider text-slate-600 md:flex">
              <a className="hover:text-emerald-700 transition-colors" href="#home">Home</a>
              <a className="hover:text-emerald-700 transition-colors" href="#features">Features</a>
              <a className="hover:text-emerald-700 transition-colors" href="#about">About</a>
              <PortalButton href="/login" className="px-6 py-2.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white shadow-lg shadow-emerald-700/20 transition-all transform hover:-translate-y-0.5">
                Login / Portal
              </PortalButton>
            </nav>
          </div>
        </header>

        {/* Hero Section */}
        <section id="home" className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 px-6 md:px-12">
          <div className="mx-auto max-w-[1280px]">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
              
              {/* Left Content */}
              <div className="max-w-xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 mb-6">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white">
                    <BadgeCheck className="h-3 w-3" />
                  </span>
                  <span className="text-xs font-bold uppercase tracking-widest text-emerald-800">
                    Official Mentoring Portal
                  </span>
                </div>

                <h1 className="text-5xl md:text-6xl lg:text-[4rem] font-black text-slate-900 leading-[1.1] tracking-tight">
                  Empowering <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
                    Students
                  </span> for <br /> Tomorrow.
                </h1>

                <p className="mt-6 text-lg text-slate-600 leading-relaxed font-medium max-w-lg">
                  A modern, unified platform for SNIST students, faculty, and administrators to track academic progress, connect with mentors, and access confidential counseling.
                </p>

                <div className="mt-10 flex flex-wrap items-center gap-5">
                  <PortalButton href="/login" className="px-8 py-4 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-[15px] shadow-xl shadow-slate-900/20 transition-all transform hover:-translate-y-1 flex items-center gap-2">
                    Open Student Portal
                  </PortalButton>
                  <PortalButton href="#features" variant="secondary" className="px-8 py-4 rounded-full bg-white border-2 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 text-[15px] transition-all">
                    Explore Features
                  </PortalButton>
                </div>

                <div className="mt-12 flex items-center gap-8 border-t border-slate-200 pt-8">
                  <div>
                    <div className="text-3xl font-black text-slate-900">800+</div>
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mt-1">Students</div>
                  </div>
                  <div className="w-px h-10 bg-slate-200"></div>
                  <div>
                    <div className="text-3xl font-black text-slate-900">24/7</div>
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mt-1">Support</div>
                  </div>
                  <div className="w-px h-10 bg-slate-200 hidden sm:block"></div>
                  <div className="hidden sm:block">
                    <div className="text-3xl font-black text-slate-900">100%</div>
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mt-1">Confidential</div>
                  </div>
                </div>
              </div>

              {/* Right Image (College BG) */}
              <div className="relative h-[500px] lg:h-[650px] w-full rounded-[2.5rem] overflow-hidden shadow-2xl shadow-emerald-900/10 group">
                <div className="absolute inset-0 bg-emerald-900/10 group-hover:bg-transparent transition-colors duration-700 z-10" />
                <img 
                  src="/assets/college-bg.jpg" 
                  alt="Sreenidhi Institute Campus" 
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                />
                
                {/* Floating Glassmorphism Card */}
                <div className="absolute bottom-8 left-8 right-8 z-20 rounded-3xl border border-white/20 bg-white/70 backdrop-blur-xl p-6 shadow-2xl">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/30">
                      <GraduationCap className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg">Academic Excellence</h3>
                      <p className="text-sm font-medium text-slate-700 mt-0.5">Track your SGPA, CGPA & Backlogs</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="bg-slate-900 py-24 px-6 md:px-12 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-900/20 rounded-full blur-[120px] pointer-events-none"></div>
          
          <div className="mx-auto max-w-[1280px] relative z-10">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-sm font-black uppercase tracking-[0.3em] text-emerald-400 mb-4">Core Features</h2>
              <h3 className="text-3xl md:text-5xl font-black text-white leading-tight">Everything you need to succeed.</h3>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: BadgeCheck, title: 'Mentoring', desc: 'Direct connection with assigned faculty mentors.', color: 'from-blue-400 to-indigo-500' },
                { icon: GraduationCap, title: 'Academics', desc: 'Detailed semester-wise breakdown of marks.', color: 'from-emerald-400 to-teal-500' },
                { icon: BriefcaseBusiness, title: 'Career Prep', desc: 'Manage skills, certifications, and activities.', color: 'from-amber-400 to-orange-500' },
                { icon: Headphones, title: 'Counselling', desc: 'Confidential support for personal well-being.', color: 'from-rose-400 to-pink-500' }
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="group relative rounded-3xl bg-white/5 border border-white/10 p-8 hover:bg-white/10 transition-colors">
                    <div className={`absolute top-0 left-8 right-8 h-px bg-gradient-to-r transparent via-white/20 to-transparent`} />
                    <div className={`inline-flex p-3 rounded-2xl bg-gradient-to-br ${item.color} shadow-lg mb-6`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <h4 className="text-xl font-bold text-white mb-3">{item.title}</h4>
                    <p className="text-slate-400 font-medium leading-relaxed">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer id="about" className="bg-white py-12 px-6 md:px-12 border-t border-slate-200">
          <div className="mx-auto flex max-w-[1280px] flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-3">
              <Brand />
              <div className="text-sm font-bold text-slate-800">
                Sreenidhi Institute of Science & Technology
              </div>
            </div>
            
            <div className="text-sm font-medium text-slate-500">
              © {new Date().getFullYear()} SNIST. All rights reserved.
            </div>

            <div className="flex gap-6">
              <span className="flex items-center gap-2 text-sm font-bold text-slate-600">
                <ShieldCheck className="h-4 w-4 text-emerald-600" /> Secure
              </span>
              <span className="flex items-center gap-2 text-sm font-bold text-slate-600">
                <BadgeCheck className="h-4 w-4 text-emerald-600" /> Trusted
              </span>
            </div>
          </div>
        </footer>

      </div>
    </main>
  );
}