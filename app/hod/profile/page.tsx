'use client';

import { useEffect, useState } from 'react';
import { PageShell } from '@/components/page-shell';
import { Sidebar } from '@/components/sidebar';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { supabase } from '@/lib/supabase';
import { Loader2, User, Phone, Mail, Layers, Briefcase, Key, Edit2, X } from 'lucide-react';

const hodSidebarItems = [
  { href: '/hod', label: 'HOD Dashboard' },
  { href: '/hod/profile', label: 'Profile' },
  { href: '/hod/students', label: 'Students' },
  { href: '/hod/queries', label: 'Student Queries' },
  { href: '/hod/reports', label: 'Reports' }
];

export default function HodProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>({
    name: '',
    designation: '',
    department: '',
    contact: '',
    photo: ''
  });
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function loadHodProfile() {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      const userId = session.user.id;
      const email = session.user.email || '';

      // Get name
      const { data: userDb } = await supabase
        .from('users')
        .select('name')
        .eq('id', userId)
        .single();

      // Get HOD details
      const { data: hodDb } = await supabase
        .from('hod_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      const initialData = {
        name: userDb?.name || session.user.user_metadata?.name || 'Dr. D. Mohan',
        designation: hodDb?.designation || 'Professor & HOD',
        department: hodDb?.department || 'ECM – Electronics & Computer Engineering',
        facultyId: hodDb?.faculty_id || 'HOD10234',
        email: email,
        contact: hodDb?.contact_number || '+91 9876543210',
        photo: hodDb?.profile_photo || ''
      };

      setProfile(initialData);
      setFormData(initialData);
    } catch (err) {
      console.error('Error fetching HOD profile:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHodProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          setFormData((prev: any) => ({ ...prev, photo: dataUrl }));
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
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

      // 2. Update hod_profiles details
      const { error: profileError } = await supabase
        .from('hod_profiles')
        .update({
          designation: formData.designation,
          department: formData.department,
          contact_number: formData.contact,
          profile_photo: formData.photo
        })
        .eq('user_id', userId);

      if (profileError) throw profileError;

      setSaveMessage('Profile updated successfully!');
      await loadHodProfile();
      setTimeout(() => {
        setIsEditing(false);
        setSaveMessage(null);
      }, 3000);
    } catch (err: any) {
      console.error('Error updating HOD profile:', err);
      setSaveError(err.message || 'An error occurred while saving changes.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedRoute role="hod">
      <PageShell title="HOD Profile" subtitle="Sreenidhi Institute of Science and Technology">
        <div className="grid gap-6 p-4 md:p-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <Sidebar active="/hod/profile" items={hodSidebarItems} />

          <div className="grid gap-6">
            {loading ? (
              <div className="portal-card flex h-[350px] items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-slate-500">
                  <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
                  <span className="text-sm font-semibold">Loading profile information…</span>
                </div>
              </div>
            ) : (
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

                <div className="grid gap-8 md:grid-cols-[240px_1fr] lg:grid-cols-[260px_1fr]">
                  
                  {/* Left: Profile Photo Container */}
                  <div className="rounded-3xl bg-[linear-gradient(180deg,#f0f6f3,#e7f0eb)] p-4 flex flex-col items-center justify-center shrink-0">
                    <div className="relative aspect-square w-32 h-32 md:w-full md:h-auto overflow-hidden rounded-2xl bg-white shadow-inner flex items-center justify-center">
                      {profile.photo ? (
                        <img
                          src={profile.photo}
                          alt={profile.name}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(profile.name)}`;
                          }}
                        />
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center text-slate-455">
                          <User className="h-10 w-10 md:h-16 md:w-16 text-emerald-800/40" />
                          <span className="mt-2 text-[10px] md:text-xs font-semibold text-emerald-800/40 text-center">No photo</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Static Profile Details */}
                  <div className="flex flex-col justify-center text-portal-ink">
                    <div className="mb-6">
                      <h2 className="text-3xl font-bold tracking-tight">{profile.name}</h2>
                      <p className="text-emerald-700 font-semibold text-sm tracking-wide mt-1 uppercase">{profile.designation}</p>
                    </div>

                    <div className="h-px bg-slate-200/80 mb-6" />

                    <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2 text-sm">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 shrink-0">
                          <User className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-slate-400 font-medium text-xs uppercase tracking-wider">Name</div>
                          <div className="font-semibold text-slate-800 mt-0.5">{profile.name}</div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 shrink-0">
                          <Briefcase className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-slate-400 font-medium text-xs uppercase tracking-wider">Designation</div>
                          <div className="font-semibold text-slate-800 mt-0.5">{profile.designation}</div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 shrink-0">
                          <Layers className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-slate-400 font-medium text-xs uppercase tracking-wider">Department</div>
                          <div className="font-semibold text-slate-800 mt-0.5">{profile.department}</div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 shrink-0">
                          <Key className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-slate-400 font-medium text-xs uppercase tracking-wider">Faculty ID</div>
                          <div className="font-semibold text-slate-800 mt-0.5">{profile.facultyId}</div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 shrink-0">
                          <Mail className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-slate-400 font-medium text-xs uppercase tracking-wider">HOD Email</div>
                          <div className="font-semibold text-emerald-800 underline break-all mt-0.5">{profile.email}</div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 shrink-0">
                          <Phone className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-slate-400 font-medium text-xs uppercase tracking-wider">Contact Number</div>
                          <div className="font-semibold text-slate-800 mt-0.5">{profile.contact}</div>
                        </div>
                      </div>

                    </div>

                  </div>

                </div>
              </div>
            )}
          </div>
        </div>

        {/* Edit HOD Modal */}
        {isEditing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-portal-ink/40 p-4 backdrop-blur-md">
            <div className="w-full max-w-2xl overflow-hidden rounded-[28px] border border-portal-line bg-white shadow-soft animate-in fade-in zoom-in-95 duration-200">
              
              <div className="flex items-center justify-between border-b border-portal-line bg-slate-50 px-6 py-4">
                <h3 className="text-xl font-bold text-portal-ink">Edit HOD Profile</h3>
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
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Designation</label>
                    <input
                      type="text"
                      name="designation"
                      value={formData.designation}
                      onChange={handleChange}
                      required
                      className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-emerald-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Department</label>
                    <input
                      type="text"
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      required
                      className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-emerald-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Contact Number</label>
                    <input
                      type="text"
                      name="contact"
                      value={formData.contact}
                      onChange={handleChange}
                      required
                      className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-emerald-600 focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Profile Photo</label>
                    <div className="mt-1 flex flex-wrap items-center gap-4">
                      {formData.photo && (
                        <div className="relative h-16 w-16 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                          <img
                            src={formData.photo}
                            alt="Preview"
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="block w-full text-sm text-slate-500
                          file:mr-4 file:py-2.5 file:px-4
                          file:rounded-xl file:border-0
                          file:text-sm file:font-semibold
                          file:bg-emerald-50 file:text-emerald-700
                          hover:file:bg-emerald-100 transition"
                      />
                    </div>
                    <p className="mt-2 text-xs text-slate-400">Choose a real image file from your device. The image will be compressed automatically before saving.</p>
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
