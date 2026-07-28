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
  Laptop
} from 'lucide-react';
import { Header } from '@/components/header';

export default function PresentationPage() {
  const [currentSlide, setCurrentSlide] = useState(1);
  const [isGeneratingPpt, setIsGeneratingPpt] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const totalSlides = 9;

  const slidesData = [
    {
      id: 1,
      title: "Project Overview & Executive Summary",
      subtitle: "SNIST Academic Mentoring and Counseling ERP System",
      icon: GraduationCap,
      category: "Overview",
      content: {
        heading: "SNIST Mentoring & Counseling System",
        description: "An enterprise-grade web application designed for Sreenidhi Institute of Science and Technology (SNIST) to streamline student mentoring, counseling, academic tracking, and career readiness evaluation across all institutional tiers.",
        highlights: [
          { title: "4 Role-Based Portals", desc: "Unified dashboards for Admin, HOD, Faculty (Mentor), and Student." },
          { title: "Single Source of Truth", desc: "100% data consistency across all views powered by student_profiles." },
          { title: "Real-Time Sync", desc: "Instant updates from approved mentor forms to executive analytics." },
          { title: "Placement Engine", desc: "Automated campus placement eligibility evaluation based on CGPA, backlogs & attendance." }
        ],
        keyMetrics: [
          { label: "Role Portals", value: "4 Tiers" },
          { label: "Data Integrity", value: "100%" },
          { label: "Page Routes", value: "45+" },
          { label: "Response Time", value: "< 100ms" }
        ]
      }
    },
    {
      id: 2,
      title: "Complete Project Workflow & Data Logging",
      subtitle: "End-to-End Lifecycle of Academic & Mentoring Records",
      icon: Layers,
      category: "Workflow",
      content: {
        heading: "Multi-Stage Data Logging & Verification Lifecycle",
        description: "The system enforces a strict 4-stage data pipeline to guarantee data authenticity and prevent administrative discrepancies.",
        stages: [
          {
            step: "01",
            title: "Student Onboarding & Entry",
            desc: "Students log academic marks, attendance certificates, extra-curricular accomplishments, skills, and counseling requests."
          },
          {
            step: "02",
            title: "Mentor Form Review & Verification",
            desc: "Assigned faculty mentors review submitted academic/attendance forms, approve records, or provide structured guidance."
          },
          {
            step: "03",
            title: "Central Database Synchronization",
            desc: "Approved forms update the centralized database (student_profiles) directly without temporary fallback logic."
          },
          {
            step: "04",
            title: "Executive Analytics Dispatch",
            desc: "HOD and Admin dashboards receive immediate, real-time analytics updates, ensuring complete data harmony across all portals."
          }
        ]
      }
    },
    {
      id: 3,
      title: "Development Process & Technology Architecture",
      subtitle: "Full-Stack System Stack & Engineering Standards",
      icon: Cpu,
      category: "Engineering",
      content: {
        heading: "Modern Full-Stack Engineering Architecture",
        description: "Built using state-of-the-art web technology standards prioritizing speed, responsive aesthetics, type safety, and security.",
        techStack: [
          { name: "Frontend Core", detail: "Next.js 15 App Router, React 19, TypeScript for strict type checking." },
          { name: "Database & Auth", detail: "Supabase Managed PostgreSQL with Row-Level Security (RLS) & JWT authentication." },
          { name: "Styling & UI Design", detail: "Vanilla CSS Tokens, Tailwind CSS, Glassmorphism, and Lucide React Icons." },
          { name: "Data Visualization", detail: "Recharts SVG library for dynamic SGPA trends, backlog distribution, and skill radars." },
          { name: "Centralized Service", detail: "lib/studentAcademicService.ts for single-pass academic metrics computation." }
        ]
      }
    },
    {
      id: 4,
      title: "Single Source of Truth & Zero Disparity Policy",
      subtitle: "Eliminating Data Inconsistencies Across Institution Roles",
      icon: Database,
      category: "Architecture",
      content: {
        heading: "Database Single Source of Truth Paradigm",
        description: "Replaced fragmented tables and hash-based fake data generators with a centralized calculation engine that enforces data authenticity.",
        comparison: [
          {
            aspect: "Data Origin",
            legacy: "Fragmented across legacy tables (academic_records, semester_sgpa)",
            unified: "Centralized in student_profiles with academic_subjects JSON"
          },
          {
            aspect: "Unupdated Data Handling",
            legacy: "Generated fake values using roll number hashing or random math",
            unified: "Strict Policy: Renders clean 'Not Updated' or 'Pending Verification'"
          },
          {
            aspect: "Cross-Portal Consistency",
            legacy: "Admin, HOD, Mentor, and Student saw different CGPA/Backlogs",
            unified: "100% Identical calculations across all 4 role portals"
          }
        ]
      }
    },
    {
      id: 5,
      title: "Portal Walkthrough: Student Portal",
      subtitle: "Self-Service Academic Progress & Career Readiness Hub",
      icon: UserCheck,
      category: "Student View",
      content: {
        heading: "Student Self-Service Dashboard",
        description: "Empowers students to track their academic performance, monitor placement eligibility, manage extracurriculars, and communicate with mentors.",
        features: [
          "Interactive SGPA & CGPA Trend Charts with semester-by-semester breakdown.",
          "Real-time Backlog History Tracker & Credit Clearance Progress.",
          "Skill Radar & Extracurricular Certification Portfolio.",
          "Counseling Query Submission system directly connecting to assigned mentor."
        ]
      }
    },
    {
      id: 6,
      title: "Portal Walkthrough: Faculty (Mentor) Portal",
      subtitle: "Assigned Mentee Management & Form Approval Center",
      icon: ShieldCheck,
      category: "Mentor View",
      content: {
        heading: "Faculty Mentor Command Center",
        description: "Equips mentors with tools to monitor assigned mentees, approve academic/attendance submissions, and provide targeted counseling.",
        features: [
          "Assigned Mentees Roster with quick risk indicators (High, Medium, Low Risk).",
          "Academic & Attendance Form Verification queue with approval/rejection workflows.",
          "Deep-dive Mentee Academic Profile & Career Recommendation Engine.",
          "Student Counseling Query Resolution interface with conversation logging."
        ]
      }
    },
    {
      id: 7,
      title: "Portal Walkthrough: HOD Portal",
      subtitle: "Departmental Oversight, Faculty Supervision & Risk Tracking",
      icon: Building2,
      category: "HOD View",
      content: {
        heading: "Head of Department (HOD) Analytics Suite",
        description: "Provides macro-level departmental analytics, mentor allocation monitoring, and academic intervention tracking.",
        features: [
          "Department-wide CGPA Distribution & Pass Percentage Analytics.",
          "Faculty & Mentor Roster Supervision with assigned mentee metrics.",
          "At-Risk Student Identification & Academic Warning System.",
          "Student Counseling Query Escalation tracking for department-wide issues."
        ]
      }
    },
    {
      id: 8,
      title: "Portal Walkthrough: Admin Portal",
      subtitle: "System Master Governance, User RBAC & Ledger Management",
      icon: Laptop,
      category: "Admin View",
      content: {
        heading: "Institution Master Administration Portal",
        description: "Grants administrators complete control over user roles, mentor assignments, master academic ledgers, and system configurations.",
        features: [
          "Master Student, Mentor, and HOD User Account Management.",
          "Mentor-to-Student Assignment Matrix editor.",
          "Academic Ledger Master Editor for verified mark overrides.",
          "System Audit Trail & Approval Request Master Desk."
        ]
      }
    },
    {
      id: 9,
      title: "Real-World Implementation & Deployment Strategy",
      subtitle: "Production Deployment, Security & Enterprise College Integration",
      icon: Server,
      category: "Deployment",
      content: {
        heading: "Enterprise Real-World Deployment Roadmap",
        description: "How the SNIST Mentoring System can be deployed and scaled in an active university environment with high reliability.",
        deploymentSteps: [
          {
            phase: "Phase 1: Cloud Hosting & High Availability",
            details: "Deploy Next.js application on Vercel / AWS Amplify Edge network with Supabase Managed PostgreSQL DB (Multi-region fallback)."
          },
          {
            phase: "Phase 2: Integration with College ERP & Hardware",
            details: "Connect RESTful/GraphQL APIs to SNIST Autonomous Examination Cell databases and Biometric Attendance Hardware."
          },
          {
            phase: "Phase 3: Security & Enterprise Access (SSO)",
            details: "Implement SAML 2.0 / OAuth2 Single Sign-On (Google Workspace @sreenidhi.edu.in) and Supabase Row Level Security."
          },
          {
            phase: "Phase 4: Monitoring, Backup & Maintenance",
            details: "Automated daily DB snapshots, Sentry error monitoring, log auditing, and zero-downtime CI/CD deployments."
          }
        ]
      }
    }
  ];

  const currentSlideData = slidesData[currentSlide - 1];

  // Dynamic PPT Download Handler powered by PptxGenJS
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
      pres.title = 'SNIST Mentoring & Counseling System - Complete Project Overview';

      // Design Palette
      const NAVY = '0F172A';
      const EMERALD = '059669';
      const DARK_EMERALD = '047857';
      const SLATE = '475569';
      const LIGHT_BG = 'F8FAFC';
      const WHITE = 'FFFFFF';

      // -------------------------------------------------------------
      // SLIDE 1: Title Slide
      // -------------------------------------------------------------
      const slide1 = pres.addSlide();
      slide1.background = { color: NAVY };

      slide1.addText('SREENIDHI INSTITUTE OF SCIENCE & TECHNOLOGY', {
        x: 0.8, y: 0.8, w: 8.4, h: 0.4,
        fontSize: 14, bold: true, color: '10B981'
      });

      slide1.addText('Academic Mentoring & Counseling System', {
        x: 0.8, y: 1.3, w: 8.4, h: 1.2,
        fontSize: 32, bold: true, color: WHITE
      });

      slide1.addText('Complete Project Presentation & System Architecture Walkthrough', {
        x: 0.8, y: 2.5, w: 8.4, h: 0.6,
        fontSize: 16, color: '94A3B8'
      });

      slide1.addShape(pres.ShapeType.rect, {
        x: 0.8, y: 3.4, w: 8.4, h: 0.05, fill: { color: EMERALD }
      });

      // Bullet Highlights Card
      slide1.addShape(pres.ShapeType.roundRect, {
        x: 0.8, y: 3.8, w: 8.4, h: 2.8, fill: { color: '1E293B' }, rectRadius: 0.1
      });

      slide1.addText([
        { text: '• Unified ERP Platform across Admin, HOD, Faculty (Mentor), and Student portals\n', options: { fontSize: 13, color: WHITE, bold: true } },
        { text: '• Centralized Single Source of Truth DB Architecture (student_profiles)\n', options: { fontSize: 13, color: WHITE } },
        { text: '• Automated Placement Eligibility Engine (CGPA, Backlogs, Attendance)\n', options: { fontSize: 13, color: WHITE } },
        { text: '• End-to-End Workflow from Student Data Entry to Executive Analytics\n', options: { fontSize: 13, color: WHITE } },
        { text: '• Zero Data Disparity & Strict "No Fake Data" Verification Policy', options: { fontSize: 13, color: '10B981', bold: true } }
      ], { x: 1.1, y: 4.0, w: 7.8, h: 2.4, lineSpacing: 22 });

      // -------------------------------------------------------------
      // SLIDE 2: Project Workflow & Data Logging
      // -------------------------------------------------------------
      const slide2 = pres.addSlide();
      slide2.background = { color: LIGHT_BG };

      slide2.addText('PROJECT WORKFLOW & DATA LOGGING', {
        x: 0.8, y: 0.5, w: 8.4, h: 0.4, fontSize: 12, bold: true, color: EMERALD
      });

      slide2.addText('4-Stage Data Verification & Analytics Lifecycle', {
        x: 0.8, y: 0.9, w: 8.4, h: 0.6, fontSize: 24, bold: true, color: NAVY
      });

      const stagesPpt = [
        { num: 'Stage 1', title: 'Student Data Onboarding', body: 'Students enter subject marks, attendance certificates, skills, and submit counseling requests.' },
        { num: 'Stage 2', title: 'Mentor Verification', body: 'Assigned faculty mentors review pending forms, verify marks, and record recommendations.' },
        { num: 'Stage 3', title: 'Single Source Sync', body: 'Approved records directly update student_profiles in Supabase PostgreSQL DB.' },
        { num: 'Stage 4', title: 'Executive Analytics', body: 'HOD & Admin portals immediately render unified real-time charts and placement metrics.' }
      ];

      stagesPpt.forEach((st, idx) => {
        const xPos = 0.8 + (idx * 2.15);
        slide2.addShape(pres.ShapeType.roundRect, {
          x: xPos, y: 1.8, w: 2.0, h: 4.8, fill: { color: WHITE }, line: { color: 'CBD5E1', width: 1 }, rectRadius: 0.1
        });
        slide2.addShape(pres.ShapeType.roundRect, {
          x: xPos + 0.15, y: 2.0, w: 1.7, h: 0.5, fill: { color: DARK_EMERALD }, rectRadius: 0.08
        });
        slide2.addText(st.num, {
          x: xPos + 0.15, y: 2.0, w: 1.7, h: 0.5, fontSize: 12, bold: true, color: WHITE, align: 'center'
        });
        slide2.addText(st.title, {
          x: xPos + 0.15, y: 2.6, w: 1.7, h: 0.8, fontSize: 13, bold: true, color: NAVY, align: 'center'
        });
        slide2.addText(st.body, {
          x: xPos + 0.15, y: 3.5, w: 1.7, h: 2.8, fontSize: 11, color: SLATE, align: 'left'
        });
      });

      // -------------------------------------------------------------
      // SLIDE 3: Development Process & Tech Stack
      // -------------------------------------------------------------
      const slide3 = pres.addSlide();
      slide3.background = { color: LIGHT_BG };

      slide3.addText('DEVELOPMENT PROCESS & TECH STACK', {
        x: 0.8, y: 0.5, w: 8.4, h: 0.4, fontSize: 12, bold: true, color: EMERALD
      });

      slide3.addText('Full-Stack Next.js 15 & Supabase Architecture', {
        x: 0.8, y: 0.9, w: 8.4, h: 0.6, fontSize: 24, bold: true, color: NAVY
      });

      const techItems = [
        { label: 'Core Framework', val: 'Next.js 15 (App Router) + React 19 + TypeScript for robust type safety.' },
        { label: 'Database & Auth', val: 'Supabase PostgreSQL DB with Row Level Security (RLS) & JWT authentication.' },
        { label: 'UI Design System', val: 'Vanilla CSS Design Tokens + Tailwind CSS + Glassmorphic elevation cards.' },
        { label: 'Visualization Engine', val: 'Recharts SVG library rendering responsive SGPA trends & backlog graphs.' },
        { label: 'Central Calculation', val: 'lib/studentAcademicService.ts computing metrics in a single pass.' }
      ];

      techItems.forEach((item, idx) => {
        const yPos = 1.8 + (idx * 0.95);
        slide3.addShape(pres.ShapeType.roundRect, {
          x: 0.8, y: yPos, w: 8.4, h: 0.8, fill: { color: WHITE }, line: { color: 'E2E8F0', width: 1 }, rectRadius: 0.08
        });
        slide3.addText(item.label, {
          x: 1.0, y: yPos + 0.15, w: 2.5, h: 0.5, fontSize: 13, bold: true, color: DARK_EMERALD
        });
        slide3.addText(item.val, {
          x: 3.5, y: yPos + 0.15, w: 5.5, h: 0.5, fontSize: 12, color: SLATE
        });
      });

      // -------------------------------------------------------------
      // SLIDE 4: Single Source of Truth Architecture
      // -------------------------------------------------------------
      const slide4 = pres.addSlide();
      slide4.background = { color: NAVY };

      slide4.addText('DATA INTEGRITY ARCHITECTURE', {
        x: 0.8, y: 0.5, w: 8.4, h: 0.4, fontSize: 12, bold: true, color: '10B981'
      });

      slide4.addText('Single Source of Truth & Zero Data Disparity', {
        x: 0.8, y: 0.9, w: 8.4, h: 0.6, fontSize: 24, bold: true, color: WHITE
      });

      // Left Box: Legacy Issues
      slide4.addShape(pres.ShapeType.roundRect, {
        x: 0.8, y: 1.8, w: 3.9, h: 4.8, fill: { color: '1E293B' }, line: { color: 'EF4444', width: 1.5 }, rectRadius: 0.1
      });
      slide4.addText('OLD / FRAGMENTED APPROACH', {
        x: 1.0, y: 2.0, w: 3.5, h: 0.4, fontSize: 13, bold: true, color: 'F87171'
      });
      slide4.addText([
        { text: '❌ Fragmented DB tables causing mismatched data\n\n', options: { fontSize: 12, color: 'CBD5E1' } },
        { text: '❌ Fallback generators using roll number hashing\n\n', options: { fontSize: 12, color: 'CBD5E1' } },
        { text: '❌ Admin, HOD, Mentor, and Student saw different CGPAs\n\n', options: { fontSize: 12, color: 'CBD5E1' } },
        { text: '❌ Confusion during campus placement shortlisting', options: { fontSize: 12, color: 'CBD5E1' } }
      ], { x: 1.0, y: 2.6, w: 3.5, h: 3.8 });

      // Right Box: Unified Engine
      slide4.addShape(pres.ShapeType.roundRect, {
        x: 5.1, y: 1.8, w: 4.1, h: 4.8, fill: { color: '064E3B' }, line: { color: '10B981', width: 1.5 }, rectRadius: 0.1
      });
      slide4.addText('UNIFIED ERP ENGINE (OUR SOLUTION)', {
        x: 5.3, y: 2.0, w: 3.7, h: 0.4, fontSize: 13, bold: true, color: '34D399'
      });
      slide4.addText([
        { text: '✅ Centralized student_profiles database record\n\n', options: { fontSize: 12, color: WHITE } },
        { text: '✅ Reusable lib/studentAcademicService.ts engine\n\n', options: { fontSize: 12, color: WHITE } },
        { text: '✅ 100% Identical metrics across all 4 role portals\n\n', options: { fontSize: 12, color: WHITE } },
        { text: '✅ Strict Policy: Missing data displays "Not Updated"', options: { fontSize: 12, color: '34D399', bold: true } }
      ], { x: 5.3, y: 2.6, w: 3.7, h: 3.8 });

      // -------------------------------------------------------------
      // SLIDES 5 to 8: Portal Walkthroughs
      // -------------------------------------------------------------
      const portalWalkthroughs = [
        {
          role: 'STUDENT PORTAL WALKTHROUGH',
          title: 'Student Self-Service Performance Hub',
          items: [
            'Interactive SGPA & CGPA Trend Charts with semester breakdown',
            'Real-Time Backlog History Tracker & Credit Clearance Progress',
            'Skill Breakdown Radar & Extracurricular Certification List',
            'Direct Student-to-Mentor Counseling Query Ticket System'
          ]
        },
        {
          role: 'FACULTY (MENTOR) PORTAL WALKTHROUGH',
          title: 'Assigned Mentee Management Command Center',
          items: [
            'Assigned Mentees Roster with quick academic risk indicators',
            'Academic & Attendance Form Verification and Approval Queue',
            'Individual Mentee Deep-Dive Profile & Career Placement Radar',
            'Student Counseling Query Resolution Desk with discussion log'
          ]
        },
        {
          role: 'HOD PORTAL WALKTHROUGH',
          title: 'Departmental Oversight & Supervision Suite',
          items: [
            'Department-wide CGPA Distribution & Pass Percentage Analytics',
            'Faculty & Mentor Roster Supervision with mentee load metrics',
            'At-Risk Student Early Identification & Warning System',
            'Departmental Counseling Query Escalation Desk'
          ]
        },
        {
          role: 'ADMIN PORTAL WALKTHROUGH',
          title: 'Institution Master Governance & RBAC Portal',
          items: [
            'Master User Management (Students, Mentors, HOD accounts)',
            'Mentor-to-Student Assignment Matrix Configurator',
            'Academic Ledger Master Editor for verified override entries',
            'System Audit Logs & Verification Request Processing'
          ]
        }
      ];

      portalWalkthroughs.forEach((p) => {
        const slideP = pres.addSlide();
        slideP.background = { color: LIGHT_BG };

        slideP.addText(p.role, {
          x: 0.8, y: 0.5, w: 8.4, h: 0.4, fontSize: 12, bold: true, color: EMERALD
        });
        slideP.addText(p.title, {
          x: 0.8, y: 0.9, w: 8.4, h: 0.6, fontSize: 24, bold: true, color: NAVY
        });

        slideP.addShape(pres.ShapeType.roundRect, {
          x: 0.8, y: 1.8, w: 8.4, h: 4.8, fill: { color: WHITE }, line: { color: 'CBD5E1', width: 1 }, rectRadius: 0.1
        });

        p.items.forEach((item, itemIdx) => {
          const yPos = 2.1 + (itemIdx * 1.05);
          slideP.addShape(pres.ShapeType.roundRect, {
            x: 1.1, y: yPos, w: 0.4, h: 0.4, fill: { color: DARK_EMERALD }, rectRadius: 0.05
          });
          slideP.addText(`${itemIdx + 1}`, {
            x: 1.1, y: yPos, w: 0.4, h: 0.4, fontSize: 12, bold: true, color: WHITE, align: 'center'
          });
          slideP.addText(item, {
            x: 1.7, y: yPos, w: 7.2, h: 0.5, fontSize: 14, bold: true, color: NAVY
          });
        });
      });

      // -------------------------------------------------------------
      // SLIDE 9: Real-World Implementation & Deployment Plan
      // -------------------------------------------------------------
      const slide9 = pres.addSlide();
      slide9.background = { color: NAVY };

      slide9.addText('REAL-WORLD IMPLEMENTATION PLAN', {
        x: 0.8, y: 0.5, w: 8.4, h: 0.4, fontSize: 12, bold: true, color: '10B981'
      });

      slide9.addText('Production Deployment & College ERP Integration', {
        x: 0.8, y: 0.9, w: 8.4, h: 0.6, fontSize: 24, bold: true, color: WHITE
      });

      const deplPhases = [
        { p: 'Phase 1', title: 'Cloud Infrastructure', desc: 'Deploy Next.js build on Vercel / AWS Amplify with Supabase Managed PostgreSQL DB.' },
        { p: 'Phase 2', title: 'ERP Hardware Sync', desc: 'Connect RESTful/GraphQL APIs to SNIST Examination Cell & Biometric Attendance Hardware.' },
        { p: 'Phase 3', title: 'Enterprise SSO & RLS', desc: 'Enforce Google Workspace SSO (@sreenidhi.edu.in) & Supabase Row-Level Security.' },
        { p: 'Phase 4', title: 'CI/CD & Maintenance', desc: 'Automated daily database backups, Sentry error monitoring, and zero-downtime updates.' }
      ];

      deplPhases.forEach((dp, idx) => {
        const xPos = idx % 2 === 0 ? 0.8 : 5.1;
        const yPos = idx < 2 ? 1.8 : 4.2;

        slide9.addShape(pres.ShapeType.roundRect, {
          x: xPos, y: yPos, w: 4.1, h: 2.1, fill: { color: '1E293B' }, line: { color: '334155', width: 1 }, rectRadius: 0.1
        });
        slide9.addText(`${dp.p}: ${dp.title}`, {
          x: xPos + 0.2, y: yPos + 0.2, w: 3.7, h: 0.4, fontSize: 13, bold: true, color: '34D399'
        });
        slide9.addText(dp.desc, {
          x: xPos + 0.2, y: yPos + 0.65, w: 3.7, h: 1.3, fontSize: 11, color: '94A3B8'
        });
      });

      // Save and trigger download
      await pres.writeFile({ fileName: 'SNIST_Mentoring_Project_Presentation.pptx' });
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
      {/* Header Bar */}
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

      {/* Hero Header Section */}
      <div className="bg-slate-950 border-b border-slate-800 py-6 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-xs uppercase tracking-widest mb-1">
              <Sparkles className="h-4 w-4" />
              <span>Project Documentation & Interactive Presentation</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              SNIST Mentoring & Counseling ERP Platform
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              Complete architectural walkthrough, data logging lifecycle, full-stack development process, and real-world deployment plan.
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

      {/* Main Slide Navigation & Content */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Slide Selector Buttons */}
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

        {/* Active Slide Display Deck */}
        <div className="relative rounded-3xl border border-slate-800 bg-slate-950 p-6 sm:p-10 shadow-2xl overflow-hidden min-h-[550px] flex flex-col justify-between">
          {/* Subtle Background Glow */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* Slide Top Badge */}
          <div className="relative z-10 flex items-center justify-between border-b border-slate-800/80 pb-5 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-emerald-950 border border-emerald-800/60 text-emerald-400 shadow-inner">
                {(() => {
                  const Icon = currentSlideData.icon;
                  return <Icon className="h-6 w-6" />;
                })()}
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-md border border-emerald-900/60">
                  {currentSlideData.category}
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                  {currentSlideData.title}
                </h2>
              </div>
            </div>
            <div className="hidden sm:block text-right">
              <span className="text-xs font-bold text-slate-500">SLIDE {currentSlide} OF {totalSlides}</span>
              <div className="text-[11px] font-semibold text-slate-400">{currentSlideData.subtitle}</div>
            </div>
          </div>

          {/* Slide Content Dynamic Render */}
          <div className="relative z-10 flex-1 my-auto space-y-6">
            
            {/* SLIDE 1: OVERVIEW */}
            {currentSlide === 1 && (
              <div className="space-y-6">
                <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                  <h3 className="text-lg font-black text-emerald-400">
                    {currentSlideData.content.heading}
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {currentSlideData.content.description}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {currentSlideData.content.highlights?.map((h, i) => (
                    <div key={i} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-emerald-800/50 transition">
                      <h4 className="text-xs font-extrabold text-white flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        <span>{h.title}</span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-1.5 leading-normal">{h.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  {currentSlideData.content.keyMetrics?.map((m, i) => (
                    <div key={i} className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-900/40 text-center">
                      <div className="text-xl font-black text-emerald-300">{m.value}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{m.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SLIDE 2: WORKFLOW & DATA LOGGING */}
            {currentSlide === 2 && (
              <div className="space-y-6">
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {currentSlideData.content.description}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {currentSlideData.content.stages?.map((st, i) => (
                    <div key={i} className="relative p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between hover:border-emerald-700/60 transition">
                      <div>
                        <div className="inline-flex items-center justify-center h-8 w-8 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-md mb-3">
                          {st.step}
                        </div>
                        <h4 className="text-sm font-extrabold text-white mb-2">{st.title}</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">{st.desc}</p>
                      </div>
                      {i < 3 && (
                        <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-20 bg-slate-950 p-1 rounded-full text-emerald-500 border border-slate-800">
                          <ArrowRight className="h-3.5 w-3.5" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SLIDE 3: TECH STACK */}
            {currentSlide === 3 && (
              <div className="space-y-4">
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
                  {currentSlideData.content.description}
                </p>

                <div className="space-y-3">
                  {currentSlideData.content.techStack?.map((t, i) => (
                    <div key={i} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:border-emerald-800/50 transition">
                      <div className="text-xs font-black text-emerald-400 uppercase tracking-wider w-44 shrink-0">
                        {t.name}
                      </div>
                      <div className="text-xs text-slate-300 font-medium flex-1">
                        {t.detail}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SLIDE 4: SINGLE SOURCE OF TRUTH */}
            {currentSlide === 4 && (
              <div className="space-y-6">
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {currentSlideData.content.description}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Old Fragmented Approach */}
                  <div className="p-5 rounded-2xl bg-rose-950/20 border border-rose-900/40 space-y-4">
                    <div className="flex items-center gap-2 text-rose-400 font-black text-xs uppercase tracking-wider">
                      <div className="h-2 w-2 rounded-full bg-rose-500" />
                      <span>Legacy / Fragmented Issues</span>
                    </div>
                    <ul className="space-y-2 text-xs text-slate-300">
                      <li className="flex items-start gap-2">
                        <span className="text-rose-500 font-bold">✕</span>
                        <span>Mismatched calculations across Admin, HOD, and Mentor pages.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-rose-500 font-bold">✕</span>
                        <span>Random hash-based mock values created misleading fake student metrics.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-rose-500 font-bold">✕</span>
                        <span>Multi-table queries (academic_records, semester_sgpa) led to stale data.</span>
                      </li>
                    </ul>
                  </div>

                  {/* Single Source Engine */}
                  <div className="p-5 rounded-2xl bg-emerald-950/30 border border-emerald-800/60 space-y-4">
                    <div className="flex items-center gap-2 text-emerald-400 font-black text-xs uppercase tracking-wider">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      <span>Unified Single Source Engine (Our Solution)</span>
                    </div>
                    <ul className="space-y-2 text-xs text-slate-200">
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">✓</span>
                        <span>Single DB record in <code className="text-emerald-300 bg-emerald-950 px-1 py-0.5 rounded">student_profiles</code> serves all roles.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">✓</span>
                        <span>Centralized <code className="text-emerald-300 bg-emerald-950 px-1 py-0.5 rounded">lib/studentAcademicService.ts</code> calculates SGPA, CGPA, and Placement metrics.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">✓</span>
                        <span>Strict "No Fake Data Policy" displays explicit "Not Updated" states when data is missing.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* SLIDES 5 to 8: PORTAL WALKTHROUGHS */}
            {currentSlide >= 5 && currentSlide <= 8 && (
              <div className="space-y-6">
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                  <h3 className="text-sm font-black text-emerald-400 mb-1">
                    {currentSlideData.content.heading}
                  </h3>
                  <p className="text-xs text-slate-300">
                    {currentSlideData.content.description}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {currentSlideData.content.features?.map((f, i) => (
                    <div key={i} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-900/60 text-emerald-400 text-xs font-extrabold border border-emerald-800/60">
                        {i + 1}
                      </div>
                      <span className="text-xs text-slate-200 font-medium leading-relaxed">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SLIDE 9: DEPLOYMENT */}
            {currentSlide === 9 && (
              <div className="space-y-6">
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {currentSlideData.content.description}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {currentSlideData.content.deploymentSteps?.map((dp, i) => (
                    <div key={i} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-700/60 transition">
                      <div className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-1.5">
                        {dp.phase}
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {dp.details}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Slide Footer Navigation Bar */}
          <div className="relative z-10 flex items-center justify-between border-t border-slate-800/80 pt-5 mt-6 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-slate-300">SNIST Mentoring ERP & Architecture System</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentSlide(prev => Math.max(1, prev - 1))}
                disabled={currentSlide === 1}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold disabled:opacity-40 transition cursor-pointer"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentSlide(prev => Math.min(totalSlides, prev + 1))}
                disabled={currentSlide === totalSlides}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold disabled:opacity-40 transition cursor-pointer"
              >
                Next Slide
              </button>
            </div>
          </div>
        </div>

        {/* Action Callout Bar */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 border border-emerald-900/60 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-600 text-white shrink-0 shadow-md">
              <Download className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Need the PowerPoint File for Meetings & Reviews?</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Generate and download the complete 9-slide PowerPoint (.pptx) file directly with all diagrams and workflow stages.
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
