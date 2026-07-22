import { BadgeCheck, BriefcaseBusiness, GraduationCap, Headphones, ShieldCheck } from 'lucide-react';
import { Brand } from '@/components/brand';
import { PortalButton } from '@/components/portal-button';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background font-sans selection:bg-emerald-100 selection:text-emerald-900">
      <div className="w-full overflow-hidden">
        
        {/* Navigation */}
        <header className="fixed top-0 z-50 w-full border-b border-border bg-white/90 backdrop-blur-md transition-all">
          <div className="mx-auto flex h-20 max-w-[1280px] items-center justify-between px-6 md:px-12">
            <div className="flex items-center gap-4">
              <Brand />
              <div className="hidden border-l-2 border-slate-200 pl-4 md:block">
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-800 leading-tight">Sreenidhi</div>
                <div className="text-[8px] font-bold uppercase tracking-[0.2em] text-slate-500">Institute of Science & Technology</div>
              </div>
            </div>

            <nav className="hidden items-center gap-8 text-[13px] font-bold uppercase tracking-wider text-slate-600 md:flex">
              <a className="hover:text-emerald-600 transition-colors" href="#home">Home</a>
              <a className="hover:text-emerald-600 transition-colors" href="#features">Features</a>
              <a className="hover:text-emerald-600 transition-colors" href="#about">About</a>
              <PortalButton href="/login" className="px-6 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 transition-all transform hover:-translate-y-0.5">
                Login / Portal
              </PortalButton>
            </nav>
          </div>
        </header>

        {/* Hero Section with Horizontal Banner */}
        <section id="home" className="pt-[80px] w-full">
          {/* Full Width Horizontal College Image */}
          <div className="w-full relative bg-slate-100 shadow-md">
            <img 
              src="/assets/college-bg.png" 
              alt="Sreenidhi Institute Campus Banner" 
              className="w-full h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px] object-cover object-center"
            />
          </div>

          {/* Centered Hero Content Below Banner */}
          <div className="mx-auto max-w-[1000px] px-6 text-center py-16 md:py-24 animate-slide-up">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 mb-8 mx-auto shadow-sm">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white">
                <BadgeCheck className="h-3 w-3" />
              </span>
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-800">
                Official Mentoring Portal
              </span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-[4rem] font-black text-slate-900 leading-[1.1] tracking-tight mx-auto max-w-4xl">
              Empowering <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">Students</span> for Tomorrow.
            </h1>

            <p className="mt-8 text-lg md:text-xl text-slate-600 leading-relaxed font-medium max-w-3xl mx-auto">
              A modern, unified platform for SNIST students, faculty, and administrators to track academic progress, connect with mentors, and access confidential counseling.
            </p>

            <div className="mt-10 flex flex-wrap justify-center items-center gap-5">
              <PortalButton href="/login" className="px-8 py-4 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-[15px] shadow-xl shadow-emerald-600/20 transition-all transform hover:-translate-y-1 flex items-center gap-2">
                Open Student Portal
              </PortalButton>
              <PortalButton href="#features" variant="secondary" className="px-8 py-4 rounded-full bg-white border-2 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 text-[15px] transition-all">
                Explore Features
              </PortalButton>
            </div>
            
            {/* Quick Stats */}
            <div className="mt-16 flex flex-wrap justify-center items-center gap-8 md:gap-16 border-t border-slate-200 pt-10">
              <div>
                <div className="text-4xl font-black text-emerald-700">800+</div>
                <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 mt-2">Students Supported</div>
              </div>
              <div className="w-px h-12 bg-slate-200 hidden sm:block"></div>
              <div>
                <div className="text-4xl font-black text-emerald-700">24/7</div>
                <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 mt-2">Counseling Access</div>
              </div>
              <div className="w-px h-12 bg-slate-200 hidden sm:block"></div>
              <div>
                <div className="text-4xl font-black text-emerald-700">100%</div>
                <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 mt-2">Confidential</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section - Enterprise Light Theme */}
        <section id="features" className="bg-slate-50 py-24 px-6 md:px-12 border-t border-border">
          <div className="mx-auto max-w-[1280px]">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-sm font-black uppercase tracking-[0.3em] text-emerald-600 mb-4">Core Features</h2>
              <h3 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 leading-tight">Everything you need to succeed.</h3>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: BadgeCheck, title: 'Mentoring', desc: 'Direct connection with assigned faculty mentors for guidance.', color: 'from-emerald-500 to-teal-600' },
                { icon: GraduationCap, title: 'Academics', desc: 'Detailed semester-wise breakdown of marks and attendance.', color: 'from-teal-500 to-emerald-600' },
                { icon: BriefcaseBusiness, title: 'Career Prep', desc: 'Manage skills, certifications, and placement activities.', color: 'from-emerald-400 to-emerald-600' },
                { icon: Headphones, title: 'Counselling', desc: 'Confidential support for personal and academic well-being.', color: 'from-teal-500 to-emerald-600' }
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="feature-card group">
                    <div className={`inline-flex p-3 rounded-2xl bg-gradient-to-br ${item.color} shadow-md mb-6`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <h4 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h4>
                    <p className="text-slate-600 font-medium leading-relaxed">{item.desc}</p>
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