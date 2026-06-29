'use client';

import { useEffect, useState } from 'react';
import { PageShell } from '@/components/page-shell';
import { Sidebar } from '@/components/sidebar';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { supabase } from '@/lib/supabase';
import { Phone, Smartphone, Edit2, Loader2, X, User, GraduationCap, Mail } from 'lucide-react';

const studentSidebarItems = [
  { href: '/student', label: 'Profile' },
  { href: '/student/academic', label: 'Academic Profile' },
  { href: '/student/extracurricular', label: 'Extracurricular Activities' },
  { href: '/student/queries', label: 'Problems / Queries' }
];

export default function StudentProfilePage() {
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
        name: userDb?.name || session.user.user_metadata?.name || '',
        rollNumber: profileDb?.roll_number || '',
        dob: profileDb?.dob || '',
        phone: profileDb?.phone || '',
        alternate_phone: profileDb?.alternate_phone || '',
        branch: profileDb?.branch || '',
        section: profileDb?.section || '',
        academic_year: profileDb?.academic_year || '',
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

  const getStudentBTechYear = (roll: string, acYear: string) => {
    const acYearStr = String(acYear || '').toLowerCase();
    if (acYearStr.includes('1') || acYearStr.includes('i year') || acYearStr.includes('first')) return 'I Year';
    if (acYearStr.includes('2') || acYearStr.includes('ii year') || acYearStr.includes('second')) return 'II Year';
    if (acYearStr.includes('3') || acYearStr.includes('iii year') || acYearStr.includes('third')) return 'III Year';
    if (acYearStr.includes('4') || acYearStr.includes('iv year') || acYearStr.includes('fourth')) return 'IV Year';

    const r = String(roll || '').trim();
    if (r.length >= 2) {
      const joinYearDigits = parseInt(r.substring(0, 2));
      if (!isNaN(joinYearDigits)) {
        const currentYear = 2026;
        const currentYearDigits = currentYear % 100; // 26
        const diff = currentYearDigits - joinYearDigits;
        if (diff === 0 || diff === 1) return 'I Year';
        if (diff === 2) return 'II Year';
        if (diff === 3) return 'III Year';
        if (diff >= 4) return 'IV Year';
      }
    }
    return 'I Year';
  };

  const bTechYear = profile ? getStudentBTechYear(profile.rollNumber, profile.academic_year) : '';

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
          setFormData((prev: any) => ({ ...prev, profile_photo: dataUrl }));
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
        <div className="grid gap-6 px-5 py-5 md:px-8 md:py-8 xl:grid-cols-[260px_minmax(0,1fr)] w-full min-w-0">
          <Sidebar active="/student" items={studentSidebarItems} />

          <div className="grid gap-6 w-full min-w-0">
            {loading ? (
              <div className="portal-card flex h-[350px] items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-slate-500">
                  <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
                  <span className="text-sm font-semibold">Loading profile information…</span>
                </div>
              </div>
            ) : (() => {
              const profileData = profile || {};
              return (
                <div className="grid gap-6">
                  
                  {/* Main Profile Dashboard Layout */}
                  <div className="grid gap-6 lg:grid-cols-3">
                    
                    {/* Left Column - Quick Overview */}
                    <div className="lg:col-span-1 space-y-6">
                      
                      {/* Profile Photo & Primary Stats Card */}
                      <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm flex flex-col items-center text-center relative overflow-hidden group">
                        <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-r from-emerald-800 to-teal-800 opacity-90" />
                        
                        {/* Edit Floating Action */}
                        <button 
                          onClick={() => {
                            setFormData(profileData);
                            setIsEditing(true);
                          }} 
                          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/40 backdrop-blur-md transition duration-200 shadow-sm"
                          title="Edit Profile"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>

                        {/* Profile Picture */}
                        <div className="relative mt-8 z-10 h-32 w-32 rounded-3xl overflow-hidden border-4 border-white shadow-md bg-slate-100 flex items-center justify-center shrink-0">
                          {profileData.profile_photo ? (
                            <img
                              src={profileData.profile_photo}
                              alt={profileData.name || 'Student'}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(profileData.name || 'Student')}`;
                              }}
                            />
                          ) : (
                            <User className="h-16 w-16 text-emerald-850/40" />
                          )}
                        </div>

                        {/* Name and Roll No */}
                        <div className="mt-4">
                          <h2 className="text-xl font-black text-slate-800 leading-tight">{profileData.name || 'N/A'}</h2>
                          <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider font-mono">{profileData.rollNumber || 'N/A'}</p>
                        </div>

                        {/* B.Tech Year Tag */}
                        <span className="mt-3.5 inline-flex items-center gap-1 rounded-2xl bg-emerald-50 border border-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 shadow-sm">
                          <GraduationCap className="h-3.5 w-3.5 text-emerald-700" />
                          <span>{bTechYear || 'N/A'}</span>
                        </span>

                        <div className="w-full h-px bg-slate-100 my-5" />

                        {/* Quick Contacts */}
                        <div className="w-full space-y-3 text-left">
                          <div className="flex items-center gap-3 text-slate-650">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-400 border border-slate-100">
                              <Smartphone className="h-4 w-4 text-emerald-800" />
                            </div>
                            <div>
                              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Primary Mobile</div>
                              <span className="text-xs font-extrabold text-slate-800">{profileData.phone || '-'}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 text-slate-650">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-400 border border-slate-100">
                              <Phone className="h-4 w-4 text-emerald-800" />
                            </div>
                            <div>
                              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Alternate Mobile</div>
                              <span className="text-xs font-extrabold text-slate-800">{profileData.alternate_phone || '-'}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 text-slate-650">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-400 border border-slate-100">
                              <Mail className="h-4 w-4 text-emerald-800" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">College Email</div>
                              <span className="text-xs font-extrabold text-slate-850 truncate block">{profileData.email || '-'}</span>
                            </div>
                          </div>
                        </div>

                      </div>

                    </div>

                    {/* Right Column - Academic & Personal Details */}
                    <div className="lg:col-span-2 space-y-6">
                      
                      {/* Academic & Institutional Card */}
                      <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4 mb-5">
                          <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-2 text-emerald-800">
                            <GraduationCap className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="text-base font-extrabold text-slate-800">Academic & Institutional Profile</h3>
                            <p className="text-[10px] font-semibold text-slate-450 uppercase tracking-wider mt-0.5">SNIST Official Registrar Enrollment</p>
                          </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          
                          <div className="bg-slate-50/50 border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between">
                            <div>
                              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">B.Tech Year</div>
                              <div className="text-sm font-extrabold text-emerald-900 mt-1 uppercase">{bTechYear || 'N/A'}</div>
                            </div>
                            <span className="text-xs font-black text-slate-300">YEAR</span>
                          </div>

                          <div className="bg-slate-50/50 border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between">
                            <div>
                              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Registered Branch</div>
                              <div className="text-sm font-extrabold text-slate-850 mt-1 uppercase">{profileData.branch || '-'}</div>
                            </div>
                            <span className="text-xs font-black text-slate-300">DEPT</span>
                          </div>

                          <div className="bg-slate-50/50 border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between">
                            <div>
                              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Class Section</div>
                              <div className="text-sm font-extrabold text-slate-855 mt-1 uppercase">{profileData.section || '-'}</div>
                            </div>
                            <span className="text-xs font-black text-slate-300">SEC</span>
                          </div>

                          <div className="bg-slate-50/50 border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between">
                            <div>
                              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Academic Year</div>
                              <div className="text-sm font-extrabold text-slate-850 mt-1">{profileData.academic_year || '-'}</div>
                            </div>
                            <span className="text-xs font-black text-slate-300">BATCH</span>
                          </div>

                          <div className="bg-slate-50/50 border border-slate-200/80 rounded-2xl p-4 sm:col-span-2 flex items-center justify-between">
                            <div>
                              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Enrollment Roll No</div>
                              <div className="text-sm font-mono font-extrabold text-slate-855 mt-1 uppercase">{profileData.rollNumber || '-'}</div>
                            </div>
                            <span className="text-xs font-black text-slate-300">UID</span>
                          </div>

                        </div>
                      </div>

                      {/* Personal Profile Details Card */}
                      <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4 mb-5">
                          <div className="rounded-xl bg-blue-50 border border-blue-100 p-2 text-blue-800">
                            <User className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="text-base font-extrabold text-slate-800">Personal Specifications</h3>
                            <p className="text-[10px] font-semibold text-slate-450 uppercase tracking-wider mt-0.5">Student General Profile Information</p>
                          </div>
                        </div>

                        <div className="divide-y divide-slate-100 text-sm">
                          <div className="grid grid-cols-[160px_1fr] py-3.5">
                            <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Full Name</span>
                            <span className="font-extrabold text-slate-850">{profileData.name || '-'}</span>
                          </div>
                          <div className="grid grid-cols-[160px_1fr] py-3.5">
                            <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Date of Birth</span>
                            <span className="font-extrabold text-slate-850">{profileData.dob || '-'}</span>
                          </div>
                          <div className="grid grid-cols-[160px_1fr] py-3.5">
                            <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Alternate Mobile</span>
                            <span className="font-extrabold text-slate-850">{profileData.alternate_phone || '-'}</span>
                          </div>
                          <div className="grid grid-cols-[160px_1fr] py-3.5">
                            <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Primary Contact</span>
                            <span className="font-extrabold text-slate-850">{profileData.phone || '-'}</span>
                          </div>
                        </div>
                      </div>

                    </div>

                  </div>
                </div>
              );
            })()}
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

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">B.Tech Year (Auto-calculated)</label>
                    <div className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-emerald-800 font-bold">
                      {getStudentBTechYear(formData.rollNumber, formData.academic_year) || 'N/A'}
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Profile Photo</label>
                    <div className="mt-1 flex flex-wrap items-center gap-4">
                      {formData.profile_photo && (
                        <div className="relative h-16 w-16 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                          <img
                            src={formData.profile_photo}
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