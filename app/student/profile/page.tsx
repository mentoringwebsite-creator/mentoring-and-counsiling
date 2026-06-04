'use client';

import { useEffect, useState } from 'react';
import { PageShell } from '@/components/page-shell';
import { Sidebar } from '@/components/sidebar';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { supabase } from '@/lib/supabase';
import { Phone, Smartphone, Edit2, Loader2, X, Calendar, BookOpen, Layers, Clock, Mail, FileText, User } from 'lucide-react';

const studentSidebarItems = [
  { href: '/student', label: 'Student Dashboard' },
  { href: '/student/profile', label: 'Profile' },
  { href: '/student/academic', label: 'Academic Profile' },
  { href: '/student/extracurricular', label: 'Extracurricular Activities' },
  { href: '/student/queries', label: 'Problems / Queries' }
];

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>({
    name: '',
    rollNumber: '',
    dob: '',
    phone: '',
    alternate_phone: '',
    branch: '',
    section: '',
    academic_year: '',
    profile_photo: ''
  });
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function loadProfile() {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      const userId = session.user.id;
      const email = session.user.email || '';

      // Get user name
      const { data: userDb } = await supabase
        .from('users')
        .select('name')
        .eq('id', userId)
        .single();

      // Get student profile
      const { data: profileDb } = await supabase
        .from('student_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      const initialData = {
        name: userDb?.name || session.user.user_metadata?.name || 'Rahul Sharma',
        rollNumber: profileDb?.roll_number || '21311A1910',
        dob: profileDb?.dob || '2004-08-14',
        phone: profileDb?.phone || '+91 9876543210',
        alternate_phone: profileDb?.alternate_phone || '+21-3311-49104',
        branch: profileDb?.branch || 'ECM - Electronics & Computer Engineering',
        section: profileDb?.section || 'A',
        academic_year: profileDb?.academic_year || '2022 - 2026',
        email: email,
        profile_photo: profileDb?.profile_photo || ''
      };

      setProfile(initialData);
      setFormData(initialData);
    } catch (err) {
      console.error('Error fetching student profile:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    setSaveMessage(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('No active user session.');
      const userId = session.user.id;

      // 1. Update user display name in users table
      const { error: userError } = await supabase
        .from('users')
        .update({ name: formData.name })
        .eq('id', userId);

      if (userError) throw userError;

      // 2. Try to update student_profiles table including alternate_phone
      const updatePayload: any = {
        roll_number: formData.rollNumber,
        branch: formData.branch,
        section: formData.section,
        academic_year: formData.academic_year,
        phone: formData.phone,
        dob: formData.dob && formData.dob.trim() !== '' ? formData.dob : null,
        profile_photo: formData.profile_photo,
        alternate_phone: formData.alternate_phone
      };

      let profileError = null;
      let alternatePhoneMissing = false;

      const { error: primaryError } = await supabase
        .from('student_profiles')
        .update(updatePayload)
        .eq('user_id', userId);

      if (primaryError) {
        // If column alternate_phone does not exist, retry without it
        if (primaryError.message.includes('alternate_phone') || primaryError.code === '42703') {
          alternatePhoneMissing = true;
          delete updatePayload.alternate_phone;
          const { error: retryError } = await supabase
            .from('student_profiles')
            .update(updatePayload)
            .eq('user_id', userId);
          if (retryError) {
            profileError = retryError;
          }
        } else {
          profileError = primaryError;
        }
      }

      if (profileError) throw profileError;

      if (alternatePhoneMissing) {
        setSaveMessage('Profile saved! (Note: Alternate phone was not updated. Ask admin to run supabase/add_alternate_phone.sql query.)');
      } else {
        setSaveMessage('Profile updated successfully!');
      }

      await loadProfile();
      setTimeout(() => {
        setIsEditing(false);
        setSaveMessage(null);
      }, 3000);
    } catch (err: any) {
      console.error('Error saving profile changes:', err);
      setSaveError(err.message || 'An error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedRoute role="student">
      <PageShell title="Profile" subtitle="Student Enhancement & Counselling Portal">
        <div className="grid gap-6 px-5 py-5 md:px-8 md:py-8 xl:grid-cols-[260px_minmax(0,1fr)]">
          <Sidebar active="/student/profile" items={studentSidebarItems} />

          <div className="grid gap-6 xl:min-w-0">
            {loading ? (
              <div className="portal-card flex h-[350px] items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-slate-500">
                  <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
                  <span className="text-sm font-semibold">Loading profile information…</span>
                </div>
              </div>
            ) : (
              <div className="grid gap-6">
                
                {/* Main Profile Card matching Rahul's screenshot layout */}
                <div className="portal-card relative overflow-hidden">
                  <button 
                    onClick={() => {
                      setFormData(profile);
                      setIsEditing(true);
                    }} 
                    className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition duration-200 shadow-sm border border-slate-200"
                    title="Edit Profile"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>

                  <div className="grid gap-6 md:grid-cols-[260px_1fr] lg:grid-cols-[280px_1fr]">
                    
                    {/* Left: Profile Photo Container */}
                    <div className="rounded-3xl bg-[linear-gradient(180deg,#f0f6f3,#e7f0eb)] p-4 flex flex-col justify-between">
                      <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-white shadow-inner flex items-center justify-center">
                        {profile.profile_photo ? (
                          <img
                            src={profile.profile_photo}
                            alt={profile.name}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(profile.name)}`;
                            }}
                          />
                        ) : (
                          <div className="flex h-full w-full flex-col items-center justify-center text-slate-400">
                            <User className="h-16 w-16 text-emerald-800/40" />
                            <span className="mt-2 text-xs font-semibold text-emerald-800/40">No photo uploaded</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Personal & Contact Grid */}
                    <div className="flex flex-col justify-center">
                      <div className="mb-4">
                        <h2 className="text-3xl font-bold tracking-tight text-portal-ink">{profile.name}</h2>
                        <p className="mt-1 text-sm font-semibold tracking-wider text-slate-500 uppercase">{profile.rollNumber}</p>
                      </div>

                      <div className="h-px bg-slate-200/80 my-4" />

                      {/* Phone contacts matching the design details */}
                      <div className="grid gap-3 mb-4">
                        <div className="flex items-center gap-3 text-slate-700">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                            <Phone className="h-4 w-4" />
                          </div>
                          <span className="text-sm font-medium">{profile.alternate_phone || 'None'}</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-700">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                            <Smartphone className="h-4 w-4" />
                          </div>
                          <span className="text-sm font-medium">{profile.phone}</span>
                        </div>
                      </div>

                      <div className="h-px bg-slate-200/80 my-4" />

                      {/* Detail listing summary grid */}
                      <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2 text-sm text-slate-700">
                        <div>
                          <span className="text-slate-400 font-medium">Name: </span>
                          <span className="font-semibold text-portal-ink">{profile.name}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-medium">Roll Number: </span>
                          <span className="font-semibold text-portal-ink">{profile.rollNumber}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-medium">Date of Birth: </span>
                          <span className="font-semibold text-portal-ink">{profile.dob}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-medium">Contact Number: </span>
                          <span className="font-semibold text-portal-ink">{profile.phone}</span>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>

                {/* Additional details listing at the bottom matching layout */}
                <div className="portal-card">
                  <h3 className="text-lg font-bold text-portal-ink mb-6 pb-2 border-b border-portal-line">Academic & Institutional Profile</h3>
                  
                  <div className="divide-y divide-slate-100 text-sm">
                    <div className="grid grid-cols-[160px_1fr] py-4">
                      <span className="font-semibold text-slate-500">Roll Number</span>
                      <span className="font-semibold text-portal-ink">{profile.rollNumber}</span>
                    </div>
                    <div className="grid grid-cols-[160px_1fr] py-4">
                      <span className="font-semibold text-slate-500">Date of Birth</span>
                      <span className="font-semibold text-portal-ink">{profile.dob}</span>
                    </div>
                    <div className="grid grid-cols-[160px_1fr] py-4">
                      <span className="font-semibold text-slate-500">Branch</span>
                      <span className="font-semibold text-portal-ink">{profile.branch}</span>
                    </div>
                    <div className="grid grid-cols-[160px_1fr] py-4">
                      <span className="font-semibold text-slate-500">Section</span>
                      <span className="font-semibold text-portal-ink">{profile.section}</span>
                    </div>
                    <div className="grid grid-cols-[160px_1fr] py-4">
                      <span className="font-semibold text-slate-500">Academic Year</span>
                      <span className="font-semibold text-portal-ink">{profile.academic_year}</span>
                    </div>
                    <div className="grid grid-cols-[160px_1fr] py-4">
                      <span className="font-semibold text-slate-500">College Email</span>
                      <span className="font-semibold text-emerald-800 underline break-all">{profile.email}</span>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>

        {/* Edit Profile Modal */}
        {isEditing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-portal-ink/40 p-4 backdrop-blur-md">
            <div className="w-full max-w-2xl overflow-hidden rounded-[28px] border border-portal-line bg-white shadow-soft animate-in fade-in zoom-in-95 duration-200">
              
              <div className="flex items-center justify-between border-b border-portal-line bg-slate-50 px-6 py-4">
                <h3 className="text-xl font-bold text-portal-ink">Edit Profile Details</h3>
                <button 
                  onClick={() => setIsEditing(false)}
                  className="rounded-full p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-emerald-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Roll Number</label>
                    <input
                      type="text"
                      name="rollNumber"
                      value={formData.rollNumber}
                      onChange={handleChange}
                      disabled
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Primary Mobile</label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-emerald-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Alternate Phone</label>
                    <input
                      type="text"
                      name="alternate_phone"
                      value={formData.alternate_phone}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-emerald-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Date of Birth</label>
                    <input
                      type="date"
                      name="dob"
                      value={formData.dob}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-emerald-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Branch</label>
                    <input
                      type="text"
                      name="branch"
                      value={formData.branch}
                      onChange={handleChange}
                      required
                      className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-emerald-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Section</label>
                    <input
                      type="text"
                      name="section"
                      value={formData.section}
                      onChange={handleChange}
                      required
                      className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-emerald-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Academic Year</label>
                    <input
                      type="text"
                      name="academic_year"
                      value={formData.academic_year}
                      onChange={handleChange}
                      required
                      className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-emerald-600 focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Profile Photo URL</label>
                    <input
                      type="text"
                      name="profile_photo"
                      value={formData.profile_photo}
                      onChange={handleChange}
                      placeholder="https://example.com/photo.jpg"
                      className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-emerald-600 focus:outline-none"
                    />
                  </div>

                </div>

                {saveError && (
                  <div className="mt-4 rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-600 border border-rose-200">
                    {saveError}
                  </div>
                )}

                {saveMessage && (
                  <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700 border border-emerald-200">
                    {saveMessage}
                  </div>
                )}

                <div className="mt-6 flex justify-end gap-3 border-t border-portal-line pt-4">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 transition disabled:opacity-70"
                  >
                    {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                    <span>Save Changes</span>
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

      </PageShell>
    </ProtectedRoute>
  );
}
