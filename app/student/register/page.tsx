import { RegisterForm } from '@/components/auth/forms';

export default function StudentRegisterPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,rgba(247,251,248,0.94),rgba(232,242,236,0.98))] py-16">
      <div className="mx-auto w-full max-w-5xl px-5">
        <RegisterForm role="student" loginHref="/student/login" />
      </div>
    </main>
  );
}

// insert into users (id, email, name, role, status)
// values (
//   'PASTE_ADMIN_AUTH_USER_ID_HERE',
//   'admin@example.com',
//   'Portal Admin',
//   'admin',
//   'Approved'
// );
