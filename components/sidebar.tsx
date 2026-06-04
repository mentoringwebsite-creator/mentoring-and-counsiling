import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Home, User, GraduationCap, Trophy, MessageSquare } from 'lucide-react';

type Item = { href: string; label: string };

const getIcon = (label: string) => {
  switch (label.toLowerCase()) {
    case 'student dashboard':
      return <Home className="h-5 w-5 mr-3 shrink-0" />;
    case 'profile':
      return <User className="h-5 w-5 mr-3 shrink-0" />;
    case 'academic profile':
      return <GraduationCap className="h-5 w-5 mr-3 shrink-0" />;
    case 'extracurricular activities':
      return <Trophy className="h-5 w-5 mr-3 shrink-0" />;
    case 'problems / queries':
    case 'problems & queries':
      return <MessageSquare className="h-5 w-5 mr-3 shrink-0" />;
    default:
      return null;
  }
};

export function Sidebar({ items, active }: { items: Item[]; active: string }) {
  return (
    <aside className="hidden w-[260px] shrink-0 rounded-[28px] bg-[linear-gradient(180deg,#1f5f4b_0%,#194a3a_100%)] p-5 text-white shadow-[0_18px_50px_rgba(17,45,33,0.16)] lg:flex lg:flex-col">
      <div className="mb-6 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-100">
        Student Portal
      </div>
      <nav className="flex flex-col gap-2">
        {items.map((item) => {
          const isActive = active === item.href;
          return (
            <Link
              key={item.href}
              href={item.href as never}
              className={cn(
                'flex items-center rounded-2xl px-4 py-3 text-sm font-medium transition duration-200',
                isActive 
                  ? 'bg-[#e2f0ea] text-[#1f5f4b] shadow-[0_10px_24px_rgba(0,0,0,0.08)]' 
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