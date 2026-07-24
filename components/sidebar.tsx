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
    case 'my dashboard':
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
    <aside className="hidden w-[260px] shrink-0 rounded-[16px] bg-emerald-800 p-5 text-emerald-50 shadow-sm border border-emerald-900/50 lg:flex lg:flex-col">
      <div className="mb-6 rounded-xl bg-white/10 px-4 py-3 text-sm font-bold uppercase tracking-[0.15em] text-white text-center shadow-sm border border-white/10">
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
                'flex items-center rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200',
                isActive 
                  ? 'bg-white text-emerald-800 shadow-md font-bold' 
                  : 'text-emerald-100/80 hover:bg-white/10 hover:text-white'
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

