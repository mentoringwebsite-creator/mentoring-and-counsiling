'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginWithStatusCheck, registerUser, type Role } from '@/lib/auth';

const roleNames: Record<Role, string> = {
  student: 'Student',
  faculty: 'Faculty',
  hod: 'HOD',
  admin: 'Admin'
};

const studentFields = [
  { name: 'name', label: 'Name', type: 'text' },
  { name: 'email', label: 'College Email', type: 'email' },
  { name: 'rollNumber', label: 'Roll Number', type: 'text' },
  { name: 'dob', label: 'Date of Birth', type: 'date' },
  { name: 'phone', label: 'Contact Number', type: 'text' },
  { name: 'branch', label: 'Branch', type: 'text' },
  { name: 'section', label: 'Section', type: 'text' },
  { name: 'academicYear', label: 'Academic Year', type: 'text' },
  { name: 'profilePhotoUrl', label: 'Profile Photo URL', type: 'text', placeholder: 'https://example.com/photo.jpg', required: false },
  { name: 'password', label: 'Password', type: 'password' }
];

const facultyFields = [
  { name: 'name', label: 'Name', type: 'text' },
  { name: 'email', label: 'Faculty Email', type: 'email' },
  { name: 'facultyId', label: 'Faculty ID', type: 'text' },
  { name: 'designation', label: 'Designation', type: 'text' },
  { name: 'qualification', label: 'Qualification', type: 'text' },
  { name: 'department', label: 'Department', type: 'text' },
  { name: 'subjects', label: 'Subjects Taught', type: 'text', placeholder: 'Data Structures, DBMS' },
  { name: 'contactNumber', label: 'Contact Number', type: 'text' },
  { name: 'profilePhotoUrl', label: 'Profile Photo URL', type: 'text', placeholder: 'https://example.com/photo.jpg', required: false },
  { name: 'password', label: 'Password', type: 'password' }
];

const hodFields = [
  { name: 'name', label: 'Name', type: 'text' },
  { name: 'email', label: 'Email', type: 'email' },
  { name: 'facultyId', label: 'Faculty ID', type: 'text' },
  { name: 'department', label: 'Department', type: 'text' },
  { name: 'designation', label: 'Designation', type: 'text' },
  { name: 'contactNumber', label: 'Contact Number', type: 'text' },
  { name: 'profilePhotoUrl', label: 'Profile Photo URL', type: 'text', placeholder: 'https://example.com/photo.jpg', required: false },
  { name: 'password', label: 'Password', type: 'password' }
];

const loginFields = [
  { name: 'email', label: 'Email', type: 'email' },
  { name: 'password', label: 'Password', type: 'password' }
];

function renderField(field: { name: string; label: string; type: string; placeholder?: string; required?: boolean }, value: Record<string, string>, onChange: (name: string, value: string) => void) {
  return (
    <label key={field.name} className="grid gap-2 text-sm font-medium text-slate-700">
      <span>{field.label}</span>
      <input
        name={field.name}
        type={field.type}
        placeholder={field.placeholder ?? ''}
        value={value[field.name] ?? ''}
        onChange={(event) => onChange(field.name, event.target.value)}
        className="rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        required={field.required !== false}
      />
    </label>
  );
}

export function LoginForm({ role, redirectTo, registerHref, showRegisterLink = true }: { role: Role; redirectTo: string; registerHref?: string; showRegisterLink?: boolean }) {
  const router = useRouter();
  const [values, setValues] = useState({ email: '', password: '' });
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (name: string, value: string) => setValues((current) => ({ ...current, [name]: value }));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const result = await loginWithStatusCheck(role, values.email.trim(), values.password);
      if (!result.success) {
        setMessage(result.message);
        return;
      }

      const destination = result.redirectTo ?? redirectTo;
      router.push(destination as any);
    } catch (err: any) {
      console.error('Login submit error:', err);
      setMessage(err?.message ?? 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[620px] rounded-[32px] border border-slate-200 bg-white/95 p-8 shadow-[0_20px_60px_rgba(14,38,36,0.12)]">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">{roleNames[role]} Login</h1>
        <p className="mt-2 text-slate-600">Enter your credentials to access your {roleNames[role].toLowerCase()} portal.</p>
      </div>
      <form className="grid gap-5" onSubmit={handleSubmit}>
        {loginFields.map((field) => renderField(field, values, handleChange))}
        {message ? <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{message}</div> : null}
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center rounded-3xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      {showRegisterLink && registerHref ? (
        <div className="mt-6 text-sm text-slate-600">
          New here? <a className="font-semibold text-emerald-600 hover:text-emerald-700" href={registerHref}>Register now</a>
        </div>
      ) : null}
    </div>
  );
}

export function RegisterForm({ role, loginHref }: { role: Role; loginHref: string }) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>({
    name: '',
    email: '',
    password: '',
    rollNumber: '',
    branch: '',
    section: '',
    academicYear: '',
    phone: '',
    dob: '',
    profilePhotoUrl: '',
    facultyId: '',
    designation: '',
    qualification: '',
    department: '',
    subjects: '',
    contactNumber: ''
  });
  const [message, setMessage] = useState<{ success: boolean; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (name: string, value: string) => setValues((current) => ({ ...current, [name]: value }));

  const fields = role === 'student' ? studentFields : role === 'faculty' ? facultyFields : hodFields;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const payload = fields.reduce((acc, field) => ({ ...acc, [field.name]: values[field.name] ?? '' }), {} as Record<string, string>);
      payload.name = values.name;
      payload.email = values.email;
      payload.password = values.password;

      const result = await registerUser(role, payload as any);
      setMessage({ success: result.success, text: result.message });
    } catch (err: any) {
      console.error('Registration submit error:', err);
      setMessage({ success: false, text: err?.message ?? 'An unexpected error occurred. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[720px] rounded-[32px] border border-slate-200 bg-white/95 p-8 shadow-[0_20px_60px_rgba(14,38,36,0.12)]">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">{roleNames[role]} Registration</h1>
        <p className="mt-2 text-slate-600">Submit your details and wait for admin approval to access the portal.</p>
      </div>
      <form className="grid gap-5" onSubmit={handleSubmit}>
        {fields.map((field) => renderField(field, values, handleChange))}
        {message ? (
          <div className={`rounded-3xl border px-4 py-3 text-sm ${
            message.success 
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800' 
              : 'border-rose-200 bg-rose-50 text-rose-800'
          }`}>
            {message.text}
          </div>
        ) : null}
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center rounded-3xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {loading ? 'Submitting…' : 'Submit registration'}
        </button>
      </form>
      <div className="mt-6 text-sm text-slate-600">
        Already registered? <a className="font-semibold text-emerald-600 hover:text-emerald-700" href={loginHref}>Sign in instead</a>
      </div>
    </div>
  );
}
