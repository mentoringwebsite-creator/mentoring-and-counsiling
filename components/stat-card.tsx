import { cn } from '@/lib/utils';

export function StatCard({ title, value, hint, tone = 'neutral' }: { title: string; value: string; hint?: string; tone?: 'neutral' | 'green' | 'orange' | 'red' }) {
  const toneClasses = {
    neutral: 'bg-[linear-gradient(180deg,#fbfcfb,#f4f7f5)] text-slate-800',
    green: 'bg-[linear-gradient(180deg,#f1fbf5,#e4f4ea)] text-emerald-900',
    orange: 'bg-[linear-gradient(180deg,#fff8f0,#f9ebdb)] text-orange-900',
    red: 'bg-[linear-gradient(180deg,#fff5f6,#f9e2e6)] text-rose-900'
  };

  return (
    <div className={cn('rounded-3xl border border-white/70 p-5 shadow-[0_14px_34px_rgba(15,44,34,0.08)]', toneClasses[tone])}>
      <div className="text-sm font-medium opacity-80">{title}</div>
      <div className="mt-2 text-3xl font-semibold tracking-[-0.04em]">{value}</div>
      {hint ? <div className="mt-1 text-sm opacity-70">{hint}</div> : null}
    </div>
  );
}