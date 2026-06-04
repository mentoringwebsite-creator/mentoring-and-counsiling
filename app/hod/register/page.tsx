import { RegisterForm } from '@/components/auth/forms';

export default function HodRegisterPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,rgba(247,251,248,0.94),rgba(232,242,236,0.98))] py-16">
      <div className="mx-auto w-full max-w-5xl px-5">
        <RegisterForm role="hod" loginHref="/hod/login" />
      </div>
    </main>
  );
}
