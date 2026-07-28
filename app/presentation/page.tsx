'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Download, 
  Presentation as PresentationIcon, 
  ChevronLeft, 
  ChevronRight, 
  FileText, 
  Layers, 
  Database, 
  ShieldCheck, 
  UserCheck, 
  GraduationCap, 
  Briefcase, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight,
  Server,
  Lock,
  Globe,
  Cpu,
  BarChart3,
  BookOpen,
  Users,
  Check,
  Building2,
  RefreshCw,
  ExternalLink,
  Laptop,
  Home,
  LogIn,
  Award,
  HelpCircle,
  TrendingUp,
  Sliders,
  ShieldAlert
} from 'lucide-react';
import { Header } from '@/components/header';

export default function PresentationPage() {
  const [currentSlide, setCurrentSlide] = useState(1);
  const [isGeneratingPpt, setIsGeneratingPpt] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const totalSlides = 16;

  const slidesData = [
    // Slide 1: Cover Slide
    {
      id: 1,
      type: "title",
      title: "Student Enhancement & Counselling Portal",
      subtitle: "A Smart System for Academic Monitoring and Student Support",
      category: "Title Slide",
      icon: GraduationCap,
      details: [
        "Sreenidhi Institute of Science and Technology (SNIST)",
        "Enterprise Academic ERP & Mentorship Infrastructure",
        "Full-Stack Web System with 4 Tier Role-Based Portals",
        "Single Source of Truth Database Engine & Real-Time Sync"
      ]
    },

    // Slide 2: Workflow & Logging Flow
    {
      id: 2,
      type: "workflow",
      title: "Complete Project Workflow & Data Logging Flow",
      subtitle: "End-to-End Lifecycle from Data Entry to Executive Analytics",
      category: "System Workflow",
      icon: Layers,
      details: [
        "Stage 1: Student Onboarding - Marks, attendance certificates, & skills logged.",
        "Stage 2: Mentor Verification - Faculty mentor reviews & verifies pending submissions.",
        "Stage 3: Single Source Sync - Approved entries directly update student_profiles table.",
        "Stage 4: Multi-Portal Dispatch - Admin, HOD, Mentor, & Student view 100% identical data."
      ]
    },

    // Slide 3: Development Process & Tech Stack
    {
      id: 3,
      type: "engineering",
      title: "Project Development Stages & Architecture",
      subtitle: "Engineering Standards, Tech Stack & Design System",
      category: "Tech Architecture",
      icon: Cpu,
      details: [
        "Frontend: Next.js 15 App Router, React 19, TypeScript, Vanilla CSS Design System",
        "Backend & DB: Supabase Managed PostgreSQL with Row-Level Security (RLS) & JWT Auth",
        "Visualization: Recharts SVG library rendering responsive SGPA trends & backlog graphs",
        "Service Layer: Centralized lib/studentAcademicService.ts single-pass calculation engine"
      ]
    },

    // Slide 4: Single Source of Truth Engine
    {
      id: 4,
      type: "architecture",
      title: "Single Source of Truth & Zero Disparity Policy",
      subtitle: "Eliminating Mismatched Student Data Across All Portals",
      category: "Data Integrity",
      icon: Database,
      details: [
        "Centralized Data: Replaced fragmented tables with single student_profiles DB record",
        "Zero Fake Data Policy: Removed roll number hashing & random mock fallback logic",
        "Unupdated State Handling: Missing data renders explicitly as 'Not Updated' or 'N/A'",
        "Role Disparity Solved: Admin, HOD, Mentor, and Student see identical CGPA & Backlogs"
      ]
    },

    // Slide 5: Home Page Explanation
    {
      id: 5,
      type: "page_details",
      title: "Home Page - Public Landing Portal",
      subtitle: "Entry Point, College Identity & Public Portal Gateway",
      category: "Page Overview",
      icon: Home,
      pageName: "Home Page",
      details: [
        "Entry point of the portal with Sreenidhi branding & campus hero imagery",
        "Displays institution identity, accreditation badges (NAAC A+, NBA), & mission statement",
        "Motivational messages and highlight cards for academic mentoring & career guidance",
        "Quick access navigation links for Home, About, Documentation, and Portal Login",
        "Direct CTA buttons for role-based authentication and platform features"
      ]
    },

    // Slide 6: Home Page Screenshot Preview
    {
      id: 6,
      type: "screenshot",
      title: "Home Page - Visual Interface Preview",
      subtitle: "Web UI Screenshot & Component Layout",
      category: "UI Preview",
      icon: Home,
      pageName: "Home Page UI",
      mockType: "homepage"
    },

    // Slide 7: Role-Based Login Explanation
    {
      id: 7,
      type: "page_details",
      title: "Role-Based Authentication Page",
      subtitle: "Secure Access Gateway & Role Dispatcher",
      category: "Page Overview",
      icon: LogIn,
      pageName: "Role-Based Login",
      details: [
        "Secure access gateway with role-selection tabs (Student, Mentor, HOD, Admin)",
        "Supabase JWT Authentication with password encryption & session management",
        "Automatic role validation checking authorization permissions before routing",
        "Seamless redirection to respective dashboards upon successful login",
        "Integrated password reset and registration access for new institutional users"
      ]
    },

    // Slide 8: Role-Based Login Screenshot Preview
    {
      id: 8,
      type: "screenshot",
      title: "Role-Based Login - Visual Interface Preview",
      subtitle: "Role Selection & Authentication UI",
      category: "UI Preview",
      icon: LogIn,
      pageName: "Role-Based Login UI",
      mockType: "login"
    },

    // Slide 9: Student Dashboard & Performance Page
    {
      id: 9,
      type: "page_details",
      title: "Student Performance Dashboard",
      subtitle: "Academic Progress, Placement Radar & Skill Analytics",
      category: "Page Overview",
      icon: UserCheck,
      pageName: "Student Dashboard Page",
      details: [
        "Self-service dashboard displaying overall CGPA, latest SGPA, & attendance percentage",
        "Interactive SGPA Trend Chart with semester-by-semester comparison bars",
        "Automated Placement Eligibility Engine showing real-time placement status & checks",
        "Skill Radar chart and extracurricular activity tracker (Clubs & Certifications)",
        "Direct ticket submission interface for student-to-mentor counseling queries"
      ]
    },

    // Slide 10: Student Dashboard Screenshot Preview
    {
      id: 10,
      type: "screenshot",
      title: "Student Dashboard - Visual Interface Preview",
      subtitle: "Student Performance & Career Analytics UI",
      category: "UI Preview",
      icon: UserCheck,
      pageName: "Student Dashboard UI",
      mockType: "student_dashboard"
    },

    // Slide 11: Faculty (Mentor) Portal Page
    {
      id: 11,
      type: "page_details",
      title: "Faculty (Mentor) Command Center",
      subtitle: "Assigned Mentee Roster, Verification Queue & Counseling",
      category: "Page Overview",
      icon: ShieldCheck,
      pageName: "Faculty Mentor Portal Page",
      details: [
        "Overview of assigned mentees with quick academic risk indicators (High, Med, Low)",
        "Pending Form Verification Queue for student-submitted academic marks & attendance",
        "Mentee Deep-Dive Profile viewer with career placement recommendations",
        "Counseling Query Resolution Desk for responding to mentee doubts & concerns",
        "Academic warning trigger interface for intervention on falling attendance/CGPA"
      ]
    },

    // Slide 12: Faculty Portal Screenshot Preview
    {
      id: 12,
      type: "screenshot",
      title: "Faculty Portal - Visual Interface Preview",
      subtitle: "Mentee Roster & Form Verification UI",
      category: "UI Preview",
      icon: ShieldCheck,
      pageName: "Faculty Portal UI",
      mockType: "faculty_dashboard"
    },

    // Slide 13: HOD Department Overview Page
    {
      id: 13,
      type: "page_details",
      title: "Head of Department (HOD) Analytics Suite",
      subtitle: "Departmental Macro Performance & Faculty Supervision",
      category: "Page Overview",
      icon: Building2,
      pageName: "HOD Overview Page",
      details: [
        "Department-wide CGPA distribution, pass percentages, & backlog statistics",
        "Faculty & Mentor Roster Supervision with assigned mentee workload tracking",
        "At-Risk Student Identification Desk highlighting students needing urgent counseling",
        "Departmental Query Escalation center for unresolved student queries",
        "Exportable PDF and Excel reports for academic review meetings"
      ]
    },

    // Slide 14: Admin Master Governance Page
    {
      id: 14,
      type: "page_details",
      title: "Admin System Governance & Ledger Console",
      subtitle: "Master RBAC, User Management & Master Academic Ledger",
      category: "Page Overview",
      icon: Laptop,
      pageName: "Admin Console Page",
      details: [
        "Master User Account Management for Students, Mentors, HODs, and Administrators",
        "Mentor-to-Student Assignment Matrix Configurator with batch assignment tools",
        "Master Academic Ledger Editor for verified mark overrides & administrative changes",
        "System Audit Trail & Approval Desk tracking all configuration updates across the platform"
      ]
    },

    // Slide 15: Student Counseling Query System Page
    {
      id: 15,
      type: "page_details",
      title: "Student Counseling & Query Resolution Desk",
      subtitle: "Direct Confidential Communication Ticket System",
      category: "Page Overview",
      icon: HelpCircle,
      pageName: "Counseling Query Page",
      details: [
        "Dedicated confidential ticketing system for academic, personal, or career guidance",
        "Categorization options (Academic, Attendance, Career Guidance, Mental Health)",
        "Real-time conversation thread between Student and assigned Faculty Mentor",
        "Status workflow indicators (Pending, Under Review, Resolved, Escalated to HOD)",
        "Complete history log preserving past counseling recommendations"
      ]
    },

    // Slide 16: Real-World Implementation & Deployment Strategy
    {
      id: 16,
      type: "deployment",
      title: "Real-World Implementation & Deployment Strategy",
      subtitle: "Production Deployment, Security & Enterprise College Integration",
      category: "Deployment Plan",
      icon: Server,
      details: [
        "Phase 1: Cloud Hosting & High Availability - Vercel / AWS Amplify with Supabase PostgreSQL DB",
        "Phase 2: Integration with College Hardware - REST APIs for SNIST Exam Cell & Biometric Attendance",
        "Phase 3: Security & Enterprise SSO - Google Workspace (@sreenidhi.edu.in) & Supabase RLS",
        "Phase 4: CI/CD & Maintenance - Automated DB backups, Sentry error logs, & zero-downtime updates"
      ]
    }
  ];

  const currentSlideData = slidesData[currentSlide - 1];

  // Dynamic PowerPoint (.pptx) Download Handler powered by PptxGenJS
  const handleDownloadPpt = async () => {
    try {
      setIsGeneratingPpt(true);
      setDownloadSuccess(false);

      // Dynamically import pptxgenjs
      const pptxgenModule: any = await import('pptxgenjs');
      const PptxGenJS = pptxgenModule.default || pptxgenModule;
      const pres = new PptxGenJS();

      pres.layout = 'LAYOUT_16x9';
      pres.author = 'SNIST Development Team';
      pres.company = 'Sreenidhi Institute of Science and Technology';
      pres.title = 'SNIST Mentoring & Counseling Portal - Complete Presentation';

      // Design Colors
      const NAVY = '0F172A';
      const EMERALD = '059669';
      const DARK_EMERALD = '047857';
      const SLATE = '475569';
      const LIGHT_BG = 'F8FAFC';
      const WHITE = 'FFFFFF';
      const GREY_HEADER = 'E2E8F0';
      const RED_TEXT = 'DC2626';

      slidesData.forEach((s) => {
        const slide = pres.addSlide();

        if (s.type === 'title') {
          // Slide 1: Cover Title Slide
          slide.background = { color: WHITE };

          // Top Grey Header Band
          slide.addShape(pres.ShapeType.rect, {
            x: 0.5, y: 0.8, w: 9.0, h: 2.2, fill: { color: 'E2E8F0' }
          });

          slide.addText(s.title, {
            x: 0.8, y: 1.0, w: 8.4, h: 1.0,
            fontSize: 32, bold: true, color: NAVY, align: 'center'
          });

          slide.addText(s.subtitle, {
            x: 0.8, y: 2.1, w: 8.4, h: 0.6,
            fontSize: 18, bold: true, color: RED_TEXT, align: 'center'
          });

          // Bullet Points Card
          slide.addShape(pres.ShapeType.roundRect, {
            x: 1.0, y: 3.4, w: 8.0, h: 3.2, fill: { color: 'F1F5F9' }, line: { color: 'CBD5E1', width: 1 }, rectRadius: 0.1
          });

          const bulletTexts = (s.details || []).map(d => ({
            text: `• ${d}\n\n`, options: { fontSize: 13, color: NAVY }
          }));

          slide.addText(bulletTexts, { x: 1.3, y: 3.6, w: 7.4, h: 2.8 });

        } else if (s.type === 'page_details') {
          // Bullet Explanation Slide (Matches User Reference Screenshots)
          slide.background = { color: WHITE };

          // Top Header Grey Band
          slide.addShape(pres.ShapeType.rect, {
            x: 0.5, y: 0.5, w: 9.0, h: 1.2, fill: { color: GREY_HEADER }
          });

          slide.addText(s.pageName || s.title, {
            x: 0.8, y: 0.6, w: 8.4, h: 1.0,
            fontSize: 28, bold: true, color: NAVY, align: 'center'
          });

          // Bullet Points Content
          const bulletArray = (s.details || []).map(d => ({
            text: `• ${d}\n\n`, options: { fontSize: 15, color: NAVY }
          }));

          slide.addText(bulletArray, {
            x: 1.0, y: 2.2, w: 8.0, h: 4.8, lineSpacing: 24
          });

        } else if (s.type === 'screenshot') {
          // UI Screenshot / Mockup Card Slide
          slide.background = { color: LIGHT_BG };

          slide.addText(s.title, {
            x: 0.5, y: 0.4, w: 9.0, h: 0.5, fontSize: 18, bold: true, color: DARK_EMERALD, align: 'center'
          });

          // Draw Simulated Browser Frame
          slide.addShape(pres.ShapeType.roundRect, {
            x: 0.8, y: 1.0, w: 8.4, h: 5.6, fill: { color: WHITE }, line: { color: '94A3B8', width: 1.5 }, rectRadius: 0.1
          });

          // Browser Header
          slide.addShape(pres.ShapeType.rect, {
            x: 0.8, y: 1.0, w: 8.4, h: 0.5, fill: { color: '1E293B' }
          });
          slide.addText(`SNIST Mentoring Portal - ${s.pageName}`, {
            x: 1.0, y: 1.05, w: 8.0, h: 0.4, fontSize: 11, bold: true, color: WHITE
          });

          // Page Mock Contents
          slide.addShape(pres.ShapeType.rect, {
            x: 1.0, y: 1.7, w: 8.0, h: 0.8, fill: { color: '065F46' }
          });
          slide.addText('SREENIDHI EDUCATIONAL GROUP | Mentoring & Counselling Platform', {
            x: 1.2, y: 1.85, w: 7.6, h: 0.5, fontSize: 13, bold: true, color: WHITE
          });

          slide.addShape(pres.ShapeType.roundRect, {
            x: 1.0, y: 2.7, w: 3.8, h: 3.6, fill: { color: 'F8FAFC' }, line: { color: 'E2E8F0', width: 1 }
          });
          slide.addText('Key Features & Metrics', {
            x: 1.2, y: 2.8, w: 3.4, h: 0.4, fontSize: 12, bold: true, color: NAVY
          });
          slide.addText('• Real-time data sync\n• Role authorization\n• Analytics Dashboard\n• 100% Data Consistency', {
            x: 1.2, y: 3.3, w: 3.4, h: 2.8, fontSize: 11, color: SLATE
          });

          slide.addShape(pres.ShapeType.roundRect, {
            x: 5.0, y: 2.7, w: 4.0, h: 3.6, fill: { color: '0F172A' }, rectRadius: 0.08
          });
          slide.addText('System Interface Preview', {
            x: 5.2, y: 2.8, w: 3.6, h: 0.4, fontSize: 12, bold: true, color: '34D399'
          });
          slide.addText('Active User Session\nRole: Authorized Access\nStatus: Online & Verified', {
            x: 5.2, y: 3.4, w: 3.6, h: 2.5, fontSize: 11, color: WHITE
          });

        } else {
          // General System Slides (Workflow, Engineering, Architecture, Deployment)
          slide.background = { color: NAVY };

          slide.addText(s.category.toUpperCase(), {
            x: 0.8, y: 0.5, w: 8.4, h: 0.4, fontSize: 12, bold: true, color: '10B981'
          });

          slide.addText(s.title, {
            x: 0.8, y: 0.9, w: 8.4, h: 0.6, fontSize: 24, bold: true, color: WHITE
          });

          slide.addShape(pres.ShapeType.roundRect, {
            x: 0.8, y: 1.8, w: 8.4, h: 4.8, fill: { color: '1E293B' }, line: { color: '334155', width: 1 }, rectRadius: 0.1
          });

          const bulletList = (s.details || []).map(d => ({
            text: `✔ ${d}\n\n`, options: { fontSize: 14, color: WHITE }
          }));

          slide.addText(bulletList, {
            x: 1.1, y: 2.1, w: 7.8, h: 4.2, lineSpacing: 22
          });
        }
      });

      // Trigger PowerPoint Download
      await pres.writeFile({ fileName: 'SNIST_Mentoring_System_Complete_Presentation.pptx' });
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 5000);
    } catch (err) {
      console.error('Error generating PowerPoint presentation:', err);
      alert('Failed to generate presentation. Please check browser permissions.');
    } finally {
      setIsGeneratingPpt(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans flex flex-col">
      {/* Top Header */}
      <Header 
        showBackButton={true}
        backHref="/"
        showUserMenu={false}
        rightElement={
          <div className="flex items-center gap-3">
            <Link 
              href="/login" 
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition shadow-md"
            >
              Login to Portal
            </Link>
          </div>
        }
      />

      {/* Hero Header Banner */}
      <div className="bg-slate-950 border-b border-slate-800 py-6 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-xs uppercase tracking-widest mb-1">
              <Sparkles className="h-4 w-4" />
              <span>Page-by-Page Explanation & Interactive Presentation</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              SNIST Mentoring & Counseling ERP Platform
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              Complete architectural walkthrough, page details, screenshots preview, full-stack workflow, and real-world implementation plan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={handleDownloadPpt}
              disabled={isGeneratingPpt}
              className="inline-flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-emerald-900/30 transition transform active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isGeneratingPpt ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Generating PowerPoint...</span>
                </>
              ) : downloadSuccess ? (
                <>
                  <Check className="h-4 w-4 text-emerald-200" />
                  <span>Downloaded (.pptx)!</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  <span>Download Complete PowerPoint (.pptx)</span>
                </>
              )}
            </button>

            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition border border-slate-700 cursor-pointer"
            >
              <FileText className="h-4 w-4" />
              <span>Print / Save PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Slide Navigation & Deck Display */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Slide Buttons */}
        <div className="flex items-center justify-between bg-slate-950/80 backdrop-blur-md p-2.5 rounded-2xl border border-slate-800 overflow-x-auto scrollbar-none gap-2">
          <div className="flex items-center gap-1.5 min-w-max">
            {slidesData.map((slide) => {
              const IconComp = slide.icon;
              const isActive = slide.id === currentSlide;
              return (
                <button
                  key={slide.id}
                  onClick={() => setCurrentSlide(slide.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition duration-200 cursor-pointer whitespace-nowrap ${
                    isActive 
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40 border border-emerald-500' 
                      : 'bg-slate-900/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  <IconComp className="h-3.5 w-3.5 shrink-0" />
                  <span>Slide {slide.id}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 shrink-0 border-l border-slate-800 pl-3">
            <button
              onClick={() => setCurrentSlide(prev => Math.max(1, prev - 1))}
              disabled={currentSlide === 1}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition cursor-pointer"
              title="Previous Slide"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-black text-slate-300 min-w-[50px] text-center">
              {currentSlide} / {totalSlides}
            </span>
            <button
              onClick={() => setCurrentSlide(prev => Math.min(totalSlides, prev + 1))}
              disabled={currentSlide === totalSlides}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition cursor-pointer"
              title="Next Slide"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Slide Presentation Viewport */}
        <div className="relative rounded-3xl border border-slate-800 bg-white text-slate-900 p-6 sm:p-10 shadow-2xl overflow-hidden min-h-[580px] flex flex-col justify-between">
          
          {/* SLIDE TYPE 1: TITLE / COVER SLIDE */}
          {currentSlideData.type === 'title' && (
            <div className="flex-1 flex flex-col justify-between space-y-6 my-auto">
              <div className="bg-slate-100 rounded-2xl p-8 border border-slate-200 text-center shadow-xs">
                <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                  {currentSlideData.title}
                </h1>
                <p className="text-lg font-bold text-red-600 mt-2">
                  {currentSlideData.subtitle}
                </p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Key System Highlights</h3>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm font-semibold text-slate-800">
                  {(currentSlideData.details || []).map((d, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">•</span>
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* SLIDE TYPE 2: PAGE DETAILS / BULLET EXPLANATION (Matches User Reference Screenshots) */}
          {currentSlideData.type === 'page_details' && (
            <div className="flex-1 flex flex-col space-y-6">
              {/* Grey Title Header Band */}
              <div className="bg-slate-200/80 rounded-2xl p-5 border border-slate-300/80 text-center shadow-xs">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                  {currentSlideData.pageName || currentSlideData.title}
                </h2>
              </div>

              {/* Bullet Explanation List */}
              <div className="flex-1 my-auto px-4 sm:px-8 space-y-4">
                {(currentSlideData.details || []).map((detail, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <span className="text-xl text-slate-800 font-bold leading-none mt-0.5">•</span>
                    <span className="text-base sm:text-lg font-medium text-slate-800 leading-relaxed">
                      {detail}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SLIDE TYPE 3: UI SCREENSHOT PREVIEW CARD */}
          {currentSlideData.type === 'screenshot' && (
            <div className="flex-1 flex flex-col space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 uppercase tracking-widest">
                    {currentSlideData.category}
                  </span>
                  <h2 className="text-xl font-black text-slate-900 mt-1">{currentSlideData.title}</h2>
                </div>
                <span className="text-xs font-bold text-slate-400">{currentSlideData.subtitle}</span>
              </div>

              {/* Realistic Web Screenshot Mockup Frame */}
              <div className="flex-1 rounded-2xl border-2 border-slate-200 bg-slate-900 overflow-hidden shadow-lg flex flex-col">
                {/* Browser Top Bar */}
                <div className="bg-slate-800 px-4 py-2.5 flex items-center justify-between border-b border-slate-700">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-rose-500" />
                    <div className="h-3 w-3 rounded-full bg-amber-500" />
                    <div className="h-3 w-3 rounded-full bg-emerald-500" />
                    <span className="ml-2 text-xs font-mono text-slate-400">https://snist-mentoring.edu.in/{currentSlideData.mockType}</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded">Live UI</span>
                </div>

                {/* Screenshot UI Content Mockup */}
                <div className="flex-1 bg-slate-50 p-6 overflow-y-auto space-y-5 text-slate-900">
                  
                  {currentSlideData.mockType === 'homepage' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 bg-emerald-700 rounded-lg flex items-center justify-center text-white font-bold text-xs">SN</div>
                          <span className="font-black text-sm text-slate-900">SREENIDHI INSTITUTE OF SCIENCE & TECHNOLOGY</span>
                        </div>
                        <div className="flex gap-4 text-xs font-bold text-slate-700">
                          <span className="text-emerald-700">Home</span>
                          <span>About</span>
                          <span>Documentation</span>
                          <span className="bg-emerald-600 text-white px-3 py-1 rounded-lg">Login to Portal</span>
                        </div>
                      </div>
                      <div className="relative rounded-2xl bg-gradient-to-r from-slate-900 to-emerald-950 text-white p-8 space-y-3">
                        <span className="text-[10px] font-extrabold bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full border border-amber-500/30 uppercase tracking-widest">Empowering Students</span>
                        <h3 className="text-2xl font-black">Empowering Students for a Successful Future</h3>
                        <p className="text-xs text-slate-300 max-w-lg">A mentoring and counseling platform designed to help every student grow academically, professionally, and personally.</p>
                      </div>
                    </div>
                  )}

                  {currentSlideData.mockType === 'login' && (
                    <div className="max-w-md mx-auto bg-white p-6 rounded-2xl border border-slate-200 shadow-md space-y-4 text-center">
                      <h3 className="text-lg font-black text-slate-900">Role-Based Portal Authentication</h3>
                      <div className="grid grid-cols-4 gap-2">
                        <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">Student</div>
                        <div className="p-2 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold">Faculty</div>
                        <div className="p-2 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold">HOD</div>
                        <div className="p-2 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold">Admin</div>
                      </div>
                      <div className="space-y-2 text-left text-xs">
                        <div className="p-2.5 rounded-lg bg-slate-50 border text-slate-500">Enter Roll Number or Institutional Email</div>
                        <div className="p-2.5 rounded-lg bg-slate-50 border text-slate-500">••••••••••••</div>
                        <div className="p-2.5 rounded-lg bg-emerald-600 text-white font-bold text-center">Sign In to Dashboard</div>
                      </div>
                    </div>
                  )}

                  {currentSlideData.mockType === 'student_dashboard' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-4 gap-3 text-center">
                        <div className="p-3 bg-white rounded-xl border shadow-xs"><div className="text-[10px] text-slate-400 uppercase font-bold">CGPA</div><div className="text-lg font-black text-slate-900">8.42</div></div>
                        <div className="p-3 bg-white rounded-xl border shadow-xs"><div className="text-[10px] text-slate-400 uppercase font-bold">Backlogs</div><div className="text-lg font-black text-emerald-600">Clear (0)</div></div>
                        <div className="p-3 bg-white rounded-xl border shadow-xs"><div className="text-[10px] text-slate-400 uppercase font-bold">Attendance</div><div className="text-lg font-black text-slate-900">88.5%</div></div>
                        <div className="p-3 bg-white rounded-xl border shadow-xs"><div className="text-[10px] text-slate-400 uppercase font-bold">Placement Status</div><div className="text-xs font-extrabold text-emerald-700 bg-emerald-50 py-1 rounded">Eligible</div></div>
                      </div>
                      <div className="p-4 bg-white rounded-xl border shadow-xs flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700">SGPA Semester Trend</span>
                        <span className="text-xs font-extrabold text-emerald-700">Sem 1: 8.2 | Sem 2: 8.5 | Sem 3: 8.4 | Sem 4: 8.6</span>
                      </div>
                    </div>
                  )}

                  {currentSlideData.mockType === 'faculty_dashboard' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between bg-white p-3 rounded-xl border shadow-xs">
                        <span className="text-xs font-bold text-slate-800">Assigned Mentees (15 Students)</span>
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">All Forms Verified</span>
                      </div>
                      <div className="p-3 bg-white rounded-xl border shadow-xs text-xs space-y-2">
                        <div className="flex justify-between font-bold text-slate-700 border-b pb-1">
                          <span>Student Name & Roll</span>
                          <span>CGPA</span>
                          <span>Status</span>
                          <span>Action</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>A. Rahul (218A1A0501)</span>
                          <span>8.45</span>
                          <span className="text-emerald-600 font-bold">Low Risk</span>
                          <span className="text-emerald-700 underline font-bold cursor-pointer">View Profile</span>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>
          )}

          {/* SLIDE TYPE 4: GENERAL SYSTEM SLIDES */}
          {currentSlideData.type !== 'title' && currentSlideData.type !== 'page_details' && currentSlideData.type !== 'screenshot' && (
            <div className="flex-1 flex flex-col space-y-6">
              <div className="border-b border-slate-200 pb-3">
                <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 uppercase tracking-widest">
                  {currentSlideData.category}
                </span>
                <h2 className="text-2xl font-black text-slate-900 mt-1">{currentSlideData.title}</h2>
                <p className="text-xs text-slate-500 font-medium">{currentSlideData.subtitle}</p>
              </div>

              <div className="flex-1 my-auto px-4 sm:px-6 space-y-4">
                {(currentSlideData.details || []).map((detail, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="text-sm sm:text-base font-semibold text-slate-800 leading-relaxed">{detail}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Slide Footer */}
          <div className="border-t border-slate-200 pt-4 mt-6 flex items-center justify-between text-xs text-slate-500">
            <span className="font-bold text-slate-700">SNIST Academic Mentoring & Counseling System</span>
            <span className="font-black text-slate-900">SLIDE {currentSlide} OF {totalSlides}</span>
          </div>

        </div>

        {/* Bottom Download CTA Card */}
        <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-600 text-white shrink-0 shadow-md">
              <Download className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Download Complete PowerPoint (.pptx) Presentation</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Generates all 16 slides matching the exact page-by-page walkthrough and grey-header slide format requested.
              </p>
            </div>
          </div>

          <button
            onClick={handleDownloadPpt}
            disabled={isGeneratingPpt}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider transition shadow-lg shrink-0 cursor-pointer"
          >
            {isGeneratingPpt ? 'Generating...' : 'Download PPTX File'}
          </button>
        </div>

      </div>
    </div>
  );
}
