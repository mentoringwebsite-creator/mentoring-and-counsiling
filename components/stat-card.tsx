import { cn } from '@/lib/utils';

export function StatCard({ title, value, hint, tone = 'neutral' }: { title: string; value: string; hint?: string; tone?: 'neutral' | 'green' | 'orange' | 'red' }) {
  const toneClasses = {
    neutral: 'bg-slate-50 text-slate-800',
    green: 'bg-emerald-50 text-emerald-800',
    orange: 'bg-orange-50 text-orange-800',
    red: 'bg-rose-50 text-rose-800'
  };

  return (
    <div className={cn('rounded-3xl border border-white/60 p-5 shadow-[0_12px_32px_rgba(15,44,34,0.08)]', toneClasses[tone])}>
      <div className="text-sm font-medium opacity-80">{title}</div>
      <div className="mt-2 text-3xl font-semibold">{value}</div>
      {hint ? <div className="mt-1 text-sm opacity-70">{hint}</div> : null}
    </div>
  );
}