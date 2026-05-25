import { Brand } from '@/components/brand';
import type { ReactNode } from 'react';

export function PageShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f4f7f4_0%,#edf2ee_100%)] p-4 text-portal-ink md:p-6">
      <div className="mx-auto max-w-[1240px] overflow-hidden rounded-[36px] border border-[rgba(93,119,108,0.14)] bg-white/95 shadow-soft backdrop-blur">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-black/5 bg-white/95 px-6 py-5 md:px-8">
          <Brand compact />
          <div className="text-right">
            <div className="text-xl font-semibold">{title}</div>
            {subtitle ? <div className="text-sm text-slate-600">{subtitle}</div> : null}
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}