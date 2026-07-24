import { LoginForm } from '@/components/auth/forms';

export default function StudentLoginPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-transparent text-slate-900">
      <img src="/assets/college-bg-3.png" alt="Campus background" className="pointer-events-none absolute inset-0 h-full w-full object-cover filter brightness-105" />
      <div className="pointer-events-none absolute inset-0 bg-white/18 backdrop-blur-sm" />

      <div className="mx-auto w-full max-w-5xl px-5 py-16 relative z-10">
        <div className="mb-6 rounded-[32px] border border-slate-200 bg-white/95 p-8 shadow-[0_20px_60px_rgba(14,38,36,0.12)]">
          <h1 className="text-3xl font-bold text-slate-900">Student Login</h1>
          <p className="mt-3 text-slate-600">Enter your student email and password to continue. If you have not registered, please sign up with your student profile details.</p>
        </div>
        <LoginForm role="student" redirectTo="/student" registerHref="/student/register" />
      </div>
    </main>
  );
}
