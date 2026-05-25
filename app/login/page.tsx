"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PortalButton } from '@/components/portal-button';
import { Brand } from '@/components/brand';
import { supabase } from '@/lib/supabase';

const roles = [
  { label: 'Student / Parent Login', href: '/student', description: 'View academic progress, attendance, and mentoring details.' },
  { label: 'Faculty Login', href: '/faculty', description: 'Access mentoring dashboard and monitor assigned students.' },
  { label: 'HOD Login', href: '/hod', description: 'View department analytics and mentor activity reports.' },
  { label: 'Admin Login', href: '/admin', description: 'Manage portal data and institutional analytics.' }
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  async function handleSignIn() {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setMessage(error ? error.message : 'Signed in successfully. Redirecting...');
    if (!error) router.push('/student');
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(241,245,242,0.9))] p-4 md:p-6" style={{ backgroundImage: "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(241,245,242,0.9)), url('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1600&q=80')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className="mx-auto max-w-[1240px] overflow-hidden rounded-[36px] border border-[rgba(118,144,130,0.14)] bg-white/98 shadow-soft">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-black/5 bg-white px-6 py-5 md:px-8">
          <Brand compact />
          <div>
            <div className="text-lg font-semibold uppercase tracking-[0.12em] text-portal-ink">Student Enhancement & Counselling Portal</div>
            <div className="text-sm text-slate-600">Sreenidhi Institute of Science and Technology</div>
          </div>
        </header>

        <section className="px-6 py-10 md:px-10 md:py-14">
          <h1 className="text-center text-4xl font-bold text-portal-ink md:text-5xl">Select Your Login Type</h1>
          <p className="mt-3 text-center text-slate-600">Choose the best option to access your dashboard and institutional tools.</p>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {roles.map((role) => (
                <button key={role.label} onClick={() => router.push(role.href as never)} className="portal-card flex min-h-[220px] flex-col items-center justify-center gap-4 text-center transition hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(15,44,34,0.12)]">
                <div className="grid h-20 w-20 place-items-center rounded-[24px] bg-emerald-100 text-4xl text-emerald-900">✦</div>
                <div className="text-2xl font-semibold text-portal-ink">{role.label}</div>
                <div className="max-w-sm text-slate-600">{role.description}</div>
              </button>
            ))}
          </div>

          <div className="portal-card mx-auto mt-8 max-w-2xl">
            <div className="grid gap-4 md:grid-cols-2">
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="rounded-2xl border border-portal-line px-4 py-3 outline-none focus:border-portal-gold" />
              <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" className="rounded-2xl border border-portal-line px-4 py-3 outline-none focus:border-portal-gold" />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <PortalButton onClick={handleSignIn}>Sign in with Supabase</PortalButton>
              {message ? <span className="text-sm text-slate-600">{message}</span> : null}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}