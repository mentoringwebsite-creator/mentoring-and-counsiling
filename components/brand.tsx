import Image from 'next/image';
import Link from 'next/link';

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-3 text-portal-ink">
      <div className={compact ? "w-[140px] sm:w-[190px]" : "w-[170px] sm:w-[240px]"}>
        <Image 
          src="/assets/sreenidhi-logo.png" 
          alt="Sreenidhi logo" 
          width={compact ? 190 : 240} 
          height={64} 
          priority 
          className="h-auto w-full object-contain"
        />
      </div>
    </Link>
  );
}