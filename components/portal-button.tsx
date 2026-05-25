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
    'inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition duration-200',
    props.variant === 'secondary' ? 'border border-portal-line bg-white text-portal-ink hover:bg-slate-50' : 'bg-portal-gold text-white shadow-soft hover:-translate-y-0.5 hover:brightness-110',
    props.className
  );

  if ('href' in props) {
    return <Link href={props.href as never} className={styles}>{props.children}</Link>;
  }

  return <button onClick={props.onClick} className={styles}>{props.children}</button>;
}