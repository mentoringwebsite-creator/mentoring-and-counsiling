import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Home, User, GraduationCap, Trophy, MessageSquare, Users, FileText, Settings, TrendingUp } from 'lucide-react';

type Item = { href: string; label: string };

const getIcon = (label: string) => {
  switch (label.toLowerCase()) {
    case 'student dashboard':
    case 'faculty dashboard':
    case 'hod dashboard':
    case 'overview':
    case 'dashboard':
      return <Home className="h-5 w-5 mr-3 shrink-0" />;
    case 'profile':
      return <User className="h-5 w-5 mr-3 shrink-0" />;
    case 'academic profile':
      return <GraduationCap className="h-5 w-5 mr-3 shrink-0" />;
    case 'extracurricular activities':
      return <Trophy className="h-5 w-5 mr-3 shrink-0" />;
    case 'performance':
      return <TrendingUp className="h-5 w-5 mr-3 shrink-0" />;
    case 'problems / queries':
    case 'problems & queries':
    case 'student queries':
    case 'pending approvals':
      return <MessageSquare className="h-5 w-5 mr-3 shrink-0" />;
    case 'my students':
    case 'students':
    case 'manage students':
    case 'manage faculty':
    case 'manage hod':
      return <Users className="h-5 w-5 mr-3 shrink-0" />;
    case 'mentor notes':
    case 'reports':
      return <FileText className="h-5 w-5 mr-3 shrink-0" />;
    case 'settings':
      return <Settings className="h-5 w-5 mr-3 shrink-0" />;
    default:
      return null;
  }
};

export function Sidebar({ items, active }: { items: Item[]; active: string }) {
  const getPortalTitle = () => {
    if (active.startsWith('/student')) return 'Student Portal';
    if (active.startsWith('/faculty')) return 'Faculty Portal';
    if (active.startsWith('/hod')) return 'HOD Portal';
    if (active.startsWith('/admin')) return 'Admin Portal';
    return 'Portal';
  };

  return (
    <aside className="hidden w-[260px] shrink-0 rounded-[28px] bg-[linear-gradient(135deg,rgba(31,95,75,0.95)_0%,rgba(25,74,58,0.95)_100%)] p-5 text-white shadow-[0_20px_60px_rgba(17,45,33,0.2)] border border-white/10 backdrop-blur-xl lg:flex lg:flex-col">
      <div className="mb-6 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-100">
        {getPortalTitle()}
      </div>
      <nav className="flex flex-col gap-2">
        {items.map((item) => {
          const isActive = active === item.href;
          return (
            <Link
              key={item.href}
              href={item.href as never}
              className={cn(
                'flex items-center rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-300 ease-out hover:translate-x-1.5',
                isActive 
                  ? 'bg-gradient-to-r from-white to-[#f4f7f5] text-[#1f5f4b] shadow-[0_12px_24px_rgba(17,45,33,0.12)] border-l-4 border-amber-500 font-semibold' 
                  : 'text-emerald-50/90 hover:bg-white/10 hover:text-white'
              )}
            >
              {getIcon(item.label)}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
