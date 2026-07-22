import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

type BaseProps = {
  children: ReactNode;
  variant?: 'primary' | 'secondary';
  className?: string;
};

type LinkProps = BaseProps & { href: string; onClick?: never };
type ButtonProps = BaseProps & { href?: never; onClick: () => void };

export function PortalButton(props: LinkProps | ButtonProps) {
  const styles = cn(
    'inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition duration-200 active:scale-[0.98]',
    props.variant === 'secondary' 
      ? 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300' 
      : 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 hover:shadow-md',
    props.className
  );

  if ('href' in props) {
    return <Link href={props.href as never} className={styles}>{props.children}</Link>;
  }

  return <button onClick={props.onClick} className={styles}>{props.children}</button>;
}