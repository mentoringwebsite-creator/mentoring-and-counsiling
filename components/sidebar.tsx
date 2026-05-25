import Link from 'next/link';
import { cn } from '@/lib/utils';

type Item = { href: string; label: string };

export function Sidebar({ items, active }: { items: Item[]; active: string }) {
  return (
    <aside className="hidden w-[260px] shrink-0 rounded-[28px] bg-gradient-to-b from-portal-moss to-[#194a3a] p-5 text-white shadow-soft lg:flex lg:flex-col">
      <div className="mb-6 rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-100">
        Student Dashboard
      </div>
      <nav className="flex flex-col gap-2">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href as never}
            className={cn(
              'rounded-2xl px-4 py-3 text-sm font-medium transition',
              active === item.href ? 'bg-white/15 text-white' : 'text-emerald-50/90 hover:bg-white/10'
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}