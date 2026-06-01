import { Brand } from '@/components/brand';
import type { ReactNode } from 'react';

export function PageShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(199,217,207,0.42),transparent_30%),radial-gradient(circle_at_top_right,rgba(234,218,177,0.30),transparent_28%),linear-gradient(180deg,#f4f7f4_0%,#edf2ee_100%)] p-4 text-portal-ink md:p-6">
      <div className="mx-auto max-w-[1240px] overflow-hidden rounded-[36px] border border-white/70 bg-white/94 shadow-[0_28px_90px_rgba(16,45,37,0.12)] backdrop-blur-xl">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-black/5 bg-white/95 px-6 py-5 md:px-8">
          <div className="flex items-center gap-4">
            <Brand compact />
            <div className="hidden border-l border-black/10 pl-4 text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-[#315d47] md:grid">
              <span>Sreenidhi</span>
              <span>Student</span>
              <span>Portal</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-semibold tracking-[-0.04em]">{title}</div>
            {subtitle ? <div className="text-sm text-slate-600">{subtitle}</div> : null}
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}