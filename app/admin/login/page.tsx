import { LoginForm } from '@/components/auth/forms';

export default function AdminLoginPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,rgba(247,251,248,0.94),rgba(232,242,236,0.98))] py-16">
      <div className="mx-auto w-full max-w-5xl px-5">
        <LoginForm role="admin" redirectTo="/admin" showRegisterLink={false} />
      </div>
    </main>
  );
}
