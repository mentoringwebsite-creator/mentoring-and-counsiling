import { LoginForm } from '@/components/auth/forms';

export default function StudentLoginPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,rgba(247,251,248,0.94),rgba(232,242,236,0.98))] py-16">
      <div className="mx-auto w-full max-w-5xl px-5">
        <div className="mb-6 rounded-[32px] border border-slate-200 bg-white/95 p-8 shadow-[0_20px_60px_rgba(14,38,36,0.12)]">
          <h1 className="text-3xl font-bold text-slate-900">Student Login</h1>
          <p className="mt-3 text-slate-600">Enter your student email and password to continue. If you have not registered, please sign up with your student profile details.</p>
        </div>
        <LoginForm role="student" redirectTo="/student" registerHref="/student/register" />
      </div>
    </main>
  );
}
