import { LoginForm } from '@/components/auth/forms';

export default function HodLoginPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-transparent text-slate-900">
      <img src="/assets/college-bg-3.png" alt="Campus background" className="pointer-events-none absolute inset-0 h-full w-full object-cover filter brightness-105" />
      <div className="pointer-events-none absolute inset-0 bg-white/18 backdrop-blur-sm" />

      <div className="mx-auto w-full max-w-5xl px-5 py-16 relative z-10">
        <LoginForm role="hod" redirectTo="/hod" registerHref="/hod/register" />
      </div>
    </main>
  );
}
