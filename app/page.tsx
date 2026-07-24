'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, BadgeCheck, BriefcaseBusiness, GraduationCap, Headphones, ShieldCheck } from 'lucide-react';
import { PortalButton } from '@/components/portal-button';
import { Header } from '@/components/header';
import { Brand } from '@/components/brand';

const bannerImages = [
  '/assets/college-bg-1 .png',
  '/assets/college-bg-2 .png',
  '/assets/college-bg-3 .png'
];

export default function HomePage() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % bannerImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + bannerImages.length) % bannerImages.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % bannerImages.length);
  };

  return (
    <main className="min-h-screen bg-background font-sans selection:bg-emerald-100 selection:text-emerald-900">
      <div className="w-full overflow-hidden">
        
        {/* Navigation */}
        <div className="fixed top-0 left-0 right-0 z-50 w-full">
          <Header 
            showBackButton={false} 
            showUserMenu={false} 
            rightElement={
              <nav className="hidden items-center gap-8 text-[13px] font-bold uppercase tracking-wider text-slate-600 md:flex">
                <a className="hover:text-emerald-600 transition-colors" href="#home">Home</a>
                <a className="hover:text-emerald-600 transition-colors" href="#features">Features</a>
                <a className="hover:text-emerald-600 transition-colors" href="#about">About</a>
                <PortalButton href="/login" className="px-6 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 transition-all transform hover:-translate-y-0.5">
                  Login / Portal
                </PortalButton>
              </nav>
            }
          />
        </div>

        {/* Hero Section with Horizontal Banner */}
        <section id="home" className="pt-[72px] w-full">
          {/* Full Width Horizontal College Image Slideshow */}
          <div className="w-full relative bg-slate-100 shadow-md group h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px] overflow-hidden select-none">
            {bannerImages.map((img, idx) => (
              <div
                key={idx}
                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                  idx === currentIndex ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
              >
                <img 
                  src={img} 
                  alt={`Sreenidhi Institute Campus Banner ${idx + 1}`} 
                  className="w-full h-full object-cover object-center"
                />
              </div>
            ))}

            {/* Subtle Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/15 via-transparent to-slate-950/15 pointer-events-none" />

            {/* Navigation Arrows */}
            <button
              onClick={handlePrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-black/25 text-white hover:bg-black/45 hover:scale-105 active:scale-95 opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 shadow-sm"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-black/25 text-white hover:bg-black/45 hover:scale-105 active:scale-95 opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 shadow-sm"
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            {/* Indicator Dots */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
              {bannerImages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    idx === currentIndex ? 'w-7 bg-emerald-600' : 'w-2 bg-white/70 hover:bg-white'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
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