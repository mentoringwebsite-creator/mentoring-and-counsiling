'use client';

import { useEffect, useState } from 'react';
import { PageShell } from '@/components/page-shell';
import { Sidebar } from '@/components/sidebar';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { supabase } from '@/lib/supabase';
import { Loader2, Edit2, Trash2, Plus, ExternalLink, X } from 'lucide-react';

export default function ExtracurricularPage() {
  const [loading, setLoading] = useState(true);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [clubs, setClubs] = useState<any[]>([]);
  const [certifications, setCertifications] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [saving, setSaving] = useState(false);

  // Modal States
  const [clubModalOpen, setClubModalOpen] = useState(false);
  const [editingClubIndex, setEditingClubIndex] = useState<number | null>(null);
  const [clubName, setClubName] = useState('');
  const [clubRole, setClubRole] = useState('');
  const [clubJoined, setClubJoined] = useState('');

  const [certModalOpen, setCertModalOpen] = useState(false);
  const [editingCertIndex, setEditingCertIndex] = useState<number | null>(null);
  const [certName, setCertName] = useState('');
  const [certLink, setCertLink] = useState('');

  const loadExtracurriculars = async () => {
    try {
      setLoading(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      if (!userId) return;

      const { data, error } = await supabase
        .from('student_profiles')
        .select('id, clubs, certifications')
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      setProfileId(data.id);
      setClubs(data.clubs || []);
      setCertifications(data.certifications || []);
    } catch (err: any) {
      console.error('Error loading extracurriculars:', err);
      setFeedback({ type: 'error', message: 'Failed to load activities. Make sure SQL migration is run.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExtracurriculars();
  }, []);

  const saveToDatabase = async (updatedClubs: any[], updatedCerts: any[]) => {
    if (!profileId) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('student_profiles')
        .update({
          clubs: updatedClubs,
          certifications: updatedCerts,
        })
        .eq('id', profileId);

      if (error) throw error;
      setFeedback({ type: 'success', message: 'Activities updated successfully!' });
    } catch (err: any) {
      console.error('Error saving extracurriculars:', err);
      setFeedback({ type: 'error', message: err.message || 'Failed to save changes.' });
    } finally {
      setSaving(false);
    }
  };

  // Club Operations
  const openAddClubModal = () => {
    setEditingClubIndex(null);
    setClubName('');
    setClubRole('');
    setClubJoined('');
    setClubModalOpen(true);
  };

  const openEditClubModal = (index: number) => {
    const club = clubs[index];
    setEditingClubIndex(index);
    setClubName(club.name || '');
    setClubRole(club.role || '');
    setClubJoined(club.joined || '');
    setClubModalOpen(true);
  };

  const handleClubSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clubName.trim()) return;

    const newClub = {
      name: clubName.trim(),
      role: clubRole.trim() || 'Member',
      joined: clubJoined.trim() || new Date().getFullYear().toString(),
    };

    let updatedClubs = [...clubs];
    if (editingClubIndex !== null) {
      updatedClubs[editingClubIndex] = newClub;
    } else {
      updatedClubs.push(newClub);
    }

    setClubs(updatedClubs);
    setClubModalOpen(false);
    await saveToDatabase(updatedClubs, certifications);
  };

  const handleClubDelete = async (index: number) => {
    if (!confirm('Are you sure you want to remove this club?')) return;

    const updatedClubs = clubs.filter((_, i) => i !== index);
    setClubs(updatedClubs);
    await saveToDatabase(updatedClubs, certifications);
  };

  // Certification Operations
  const openAddCertModal = () => {
    setEditingCertIndex(null);
    setCertName('');
    setCertLink('');
    setCertModalOpen(true);
  };

  const openEditCertModal = (index: number) => {
    const cert = certifications[index];
    setEditingCertIndex(index);
    setCertName(cert.name || '');
    setCertLink(cert.link || '');
    setCertModalOpen(true);
  };

  const handleCertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certName.trim()) return;

    const newCert = {
      name: certName.trim(),
      link: certLink.trim(),
    };

    let updatedCerts = [...certifications];
    if (editingCertIndex !== null) {
      updatedCerts[editingCertIndex] = newCert;
    } else {
      updatedCerts.push(newCert);
    }

    setCertifications(updatedCerts);
    setCertModalOpen(false);
    await saveToDatabase(clubs, updatedCerts);
  };

  const handleCertDelete = async (index: number) => {
    if (!confirm('Are you sure you want to remove this certification?')) return;

    const updatedCerts = certifications.filter((_, i) => i !== index);
    setCertifications(updatedCerts);
    await saveToDatabase(clubs, updatedCerts);
  };

  return (
    <ProtectedRoute role="student">
      <PageShell title="Extracurricular Activities" subtitle="Clubs, certifications, and interests">
        <div className="grid gap-6 p-4 md:p-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <Sidebar active="/student/extracurricular" items={[{ href: '/student', label: 'Profile' }, { href: '/student/academic', label: 'Academic Profile' }, { href: '/student/extracurricular', label: 'Extracurricular Activities' }, { href: '/student/queries', label: 'Problems / Queries' }]} />
          
          <div className="grid gap-6">
            {feedback && (
              <div className={`rounded-2xl border p-3 text-sm font-semibold shadow-sm animate-fade-in ${
                feedback.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'
              }`}>
                {feedback.message}
              </div>
            )}

            {/* Clubs & Organizations */}
            <div className="portal-card">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-2xl font-semibold">Clubs & Organizations</h2>
                <button 
                  onClick={openAddClubModal}
                  disabled={loading}
                  className="rounded-2xl bg-[#1c5644] hover:bg-[#154335] px-4 py-2.5 text-xs font-semibold text-white transition flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Club</span>
                </button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-10 text-slate-500">
                  <Loader2 className="h-5 w-5 animate-spin text-[#1c5644] mr-2" />
                  <span>Loading clubs...</span>
                </div>
              ) : clubs.length === 0 ? (
                <p className="mt-6 text-sm text-slate-500 text-center py-6 bg-slate-50/50 rounded-[20px] border border-dashed border-slate-200">
                  No clubs registered. Add the clubs you are involved in.
                </p>
              ) : (
                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  {clubs.map((club, index) => (
                    <div key={index} className="group relative rounded-3xl bg-portal-paper p-5 border border-portal-line transition duration-300 hover:-translate-y-0.5 hover:shadow-soft">
                      {/* Action buttons (hover overlay) */}
                      <div className="absolute right-3 top-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => openEditClubModal(index)}
                          className="rounded-xl bg-white hover:bg-slate-50 p-2 text-slate-600 shadow-sm border border-slate-100 transition"
                          title="Edit Club"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button 
                          onClick={() => handleClubDelete(index)}
                          className="rounded-xl bg-white hover:bg-rose-50 p-2 text-rose-600 shadow-sm border border-slate-100 transition"
                          title="Delete Club"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="text-xl font-bold text-portal-ink">{club.name}</div>
                      <div className="mt-2 text-xs font-semibold text-slate-500">Role: <span className="text-slate-700">{club.role}</span></div>
                      <div className="mt-1 text-xs font-semibold text-slate-500">Joined: <span className="text-slate-700">{club.joined}</span></div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Certifications & Achievements */}
            <div className="portal-card">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-2xl font-semibold">Certifications & Achievements</h2>
                <button 
                  onClick={openAddCertModal}
                  disabled={loading}
                  className="rounded-2xl bg-[#1c5644] hover:bg-[#154335] px-4 py-2.5 text-xs font-semibold text-white transition flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Certificate</span>
                </button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-10 text-slate-500">
                  <Loader2 className="h-5 w-5 animate-spin text-[#1c5644] mr-2" />
                  <span>Loading certifications...</span>
                </div>
              ) : certifications.length === 0 ? (
                <p className="mt-6 text-sm text-slate-500 text-center py-6 bg-slate-50/50 rounded-[20px] border border-dashed border-slate-200">
                  No certifications registered. Add your certificates and achievements.
                </p>
              ) : (
                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  {certifications.map((item, index) => (
                    <div key={index} className="group relative rounded-3xl border border-portal-line bg-white p-5 transition duration-300 hover:-translate-y-0.5 hover:shadow-soft flex flex-col justify-between min-h-[120px]">
                      {/* Action buttons (hover overlay) */}
                      <div className="absolute right-3 top-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => openEditCertModal(index)}
                          className="rounded-xl bg-white hover:bg-slate-50 p-2 text-slate-600 shadow-sm border border-slate-100 transition"
                          title="Edit Certification"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button 
                          onClick={() => handleCertDelete(index)}
                          className="rounded-xl bg-white hover:bg-rose-50 p-2 text-rose-600 shadow-sm border border-slate-100 transition"
                          title="Delete Certification"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="font-bold text-portal-ink text-base max-w-[80%] leading-snug">{item.name}</div>
                      
                      <div className="mt-4">
                        {item.link ? (
                          <a 
                            href={item.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 hover:text-sky-700 hover:underline"
                          >
                            <span>View certificate</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400 italic">No link provided</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Club Modal */}
        {clubModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fadeIn">
            <div className="relative w-full max-w-md overflow-hidden rounded-[28px] bg-white p-6 shadow-xl border border-slate-100">
              <button 
                onClick={() => setClubModalOpen(false)}
                className="absolute right-4 top-4 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X className="h-5 w-5" />
              </button>

              <h3 className="text-xl font-bold text-slate-900">
                {editingClubIndex !== null ? 'Edit Club' : 'Add Club & Organization'}
              </h3>
              
              <form onSubmit={handleClubSubmit} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Club Name</label>
                  <input
                    type="text"
                    value={clubName}
                    onChange={(e) => setClubName(e.target.value)}
                    placeholder="Robotics Club"
                    required
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-xs focus:border-emerald-600 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Role / Position</label>
                  <input
                    type="text"
                    value={clubRole}
                    onChange={(e) => setClubRole(e.target.value)}
                    placeholder="Member / Volunteer / Lead"
                    required
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-xs focus:border-emerald-600 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Joined Year</label>
                  <input
                    type="number"
                    value={clubJoined}
                    onChange={(e) => setClubJoined(e.target.value)}
                    placeholder={new Date().getFullYear().toString()}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-xs focus:border-emerald-600 focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setClubModalOpen(false)}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-2xl bg-[#1c5644] hover:bg-[#154335] px-5 py-2.5 text-xs font-semibold text-white transition flex items-center gap-1.5 shadow-sm"
                  >
                    {saving && <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />}
                    <span>Save Club</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Certification Modal */}
        {certModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fadeIn">
            <div className="relative w-full max-w-md overflow-hidden rounded-[28px] bg-white p-6 shadow-xl border border-slate-100">
              <button 
                onClick={() => setCertModalOpen(false)}
                className="absolute right-4 top-4 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X className="h-5 w-5" />
              </button>

              <h3 className="text-xl font-bold text-slate-900">
                {editingCertIndex !== null ? 'Edit Certification' : 'Add Certification & Achievement'}
              </h3>
              
              <form onSubmit={handleCertSubmit} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Certification Title</label>
                  <input
                    type="text"
                    value={certName}
                    onChange={(e) => setCertName(e.target.value)}
                    placeholder="AWS Cloud Practitioner"
                    required
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-xs focus:border-emerald-600 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Verification Link (URL)</label>
                  <input
                    type="url"
                    value={certLink}
                    onChange={(e) => setCertLink(e.target.value)}
                    placeholder="https://credentials.example.com/..."
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-xs focus:border-emerald-600 focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setCertModalOpen(false)}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-2xl bg-[#1c5644] hover:bg-[#154335] px-5 py-2.5 text-xs font-semibold text-white transition flex items-center gap-1.5 shadow-sm"
                  >
                    {saving && <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />}
                    <span>Save Certificate</span>
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