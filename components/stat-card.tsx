import { cn } from '@/lib/utils';

export function StatCard({ title, value, hint, tone = 'neutral' }: { title: string; value: string; hint?: string; tone?: 'neutral' | 'green' | 'orange' | 'red' }) {
  const toneClasses = {
    neutral: 'bg-white border-slate-200 text-slate-900',
    green: 'bg-emerald-50/30 border-emerald-200 text-emerald-950',
    orange: 'bg-amber-50/30 border-amber-200 text-amber-950',
    red: 'bg-rose-50/30 border-rose-200 text-rose-950'
  };

  return (
    <div className={cn('rounded-2xl border p-5 shadow-sm transition-all duration-200 hover:shadow-md', toneClasses[tone])}>
      <div className="text-xs font-bold uppercase tracking-wider text-slate-500">{title}</div>
      <div className="mt-2 text-3xl font-extrabold tracking-tight">{value}</div>
      {hint ? <div className="mt-1.5 text-xs text-slate-400 font-medium leading-relaxed">{hint}</div> : null}
    </div>
  );
}