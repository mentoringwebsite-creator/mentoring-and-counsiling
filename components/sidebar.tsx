import Link from 'next/link';
import { cn } from '@/lib/utils';

type Item = { href: string; label: string };

export function Sidebar({ items, active }: { items: Item[]; active: string }) {
  return (
    <aside className="hidden w-[260px] shrink-0 rounded-[28px] bg-[linear-gradient(180deg,#1f5f4b_0%,#194a3a_100%)] p-5 text-white shadow-[0_18px_50px_rgba(17,45,33,0.16)] lg:flex lg:flex-col">
      <div className="mb-6 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-100">
        Student Dashboard
      </div>
      <nav className="flex flex-col gap-2">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href as never}
            className={cn(
              'rounded-2xl px-4 py-3 text-sm font-medium transition duration-200',
              active === item.href ? 'bg-white/16 text-white shadow-[0_10px_24px_rgba(0,0,0,0.12)]' : 'text-emerald-50/90 hover:bg-white/10 hover:text-white'
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}