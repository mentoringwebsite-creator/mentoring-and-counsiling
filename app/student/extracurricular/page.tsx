'use client';

import { useEffect, useState } from 'react';
import { PageShell } from '@/components/page-shell';
import { Sidebar } from '@/components/sidebar';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { supabase } from '@/lib/supabase';
import { Loader2, Edit2, Trash2, Plus, ExternalLink, X, Heart, Target, Sparkles, Image as ImageIcon, Users } from 'lucide-react';

const DEFAULT_CLUBS = [
  { name: "Robotics Club", role: "Technical Lead", joined: "2024", logo: "" },
  { name: "Coding & Algorithms Club", role: "Core Member", joined: "2023", logo: "" }
];

const DEFAULT_CERTS = [
  { name: "AWS Certified Cloud Practitioner", link: "https://aws.amazon.com", image: "" },
  { name: "Meta Front-End Developer Specialization", link: "https://www.coursera.org", image: "" }
];

const DEFAULT_INTERESTS = "Web Development, Machine Learning, UI/UX Design, Open Source Contributions";
const DEFAULT_DREAMS = "To become a software architect designing scalable and high-impact distributed applications.";
const DEFAULT_CAREER_GOALS = "Secure a Software Engineering role at a leading tech company and mentor aspiring developers.";

const DEFAULT_SKILLS = ["JavaScript", "TypeScript", "React.js", "Next.js", "Node.js", "Python", "SQL", "Git", "Tailwind CSS", "Data Structures"];

export default function ExtracurricularPage() {
  const [loading, setLoading] = useState(true);
  const [profileId, setProfileId] = useState<string | null>(null);
  
  // Data lists
  const [clubs, setClubs] = useState<any[]>([]);
  const [certifications, setCertifications] = useState<any[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkillText, setNewSkillText] = useState('');
  
  // Aspirations states
  const [interests, setInterests] = useState('');
  const [dreams, setDreams] = useState('');
  const [careerGoals, setCareerGoals] = useState('');

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [saving, setSaving] = useState(false);

  // Lightbox Preview State
  const [selectedCertImage, setSelectedCertImage] = useState<string | null>(null);

  // Modal States: Clubs
  const [clubModalOpen, setClubModalOpen] = useState(false);
  const [editingClubIndex, setEditingClubIndex] = useState<number | null>(null);
  const [clubName, setClubName] = useState('');
  const [clubRole, setClubRole] = useState('');
  const [clubJoined, setClubJoined] = useState('');
  const [clubLogo, setClubLogo] = useState<string>('');

  // Modal States: Certifications
  const [certModalOpen, setCertModalOpen] = useState(false);
  const [editingCertIndex, setEditingCertIndex] = useState<number | null>(null);
  const [certName, setCertName] = useState('');
  const [certLink, setCertLink] = useState('');
  const [certImage, setCertImage] = useState<string>('');

  // Modal States: Aspirations
  const [aspirationModalOpen, setAspirationModalOpen] = useState(false);
  const [formInterests, setFormInterests] = useState('');
  const [formDreams, setFormDreams] = useState('');
  const [formCareerGoals, setFormCareerGoals] = useState('');

  const loadExtracurriculars = async () => {
    try {
      setLoading(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      if (!userId) return;

      const { data, error } = await supabase
        .from('student_profiles')
        .select('id, clubs, certifications, interests, dreams, career_goals')
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      setProfileId(data.id);
      setClubs(data.clubs || []);
      setCertifications(data.certifications || []);
      
      const rawInterests = data.interests || '';
      let parsedInterests = rawInterests;
      let parsedSkills = DEFAULT_SKILLS;
      if (rawInterests.includes('||skills:')) {
        const parts = rawInterests.split('||skills:');
        parsedInterests = parts[0];
        const skillStr = parts[1];
        parsedSkills = skillStr.trim() ? skillStr.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
      } else if (rawInterests.trim() !== '') {
        parsedSkills = [];
      }
      
      setInterests(parsedInterests);
      setSkills(parsedSkills);
      setDreams(data.dreams || '');
      setCareerGoals(data.career_goals || '');
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

  const saveToDatabase = async (
    updatedClubs: any[], 
    updatedCerts: any[], 
    updatedInterests?: string, 
    updatedDreams?: string, 
    updatedGoals?: string,
    updatedSkills?: string[]
  ) => {
    if (!profileId) return;

    try {
      setSaving(true);
      const payload: any = {
        clubs: updatedClubs,
        certifications: updatedCerts,
      };

      const finalInterestsVal = updatedInterests !== undefined ? updatedInterests : interests;
      const finalSkillsVal = updatedSkills !== undefined ? updatedSkills : skills;
      payload.interests = finalInterestsVal + '||skills:' + finalSkillsVal.join(',');

      if (updatedDreams !== undefined) payload.dreams = updatedDreams;
      if (updatedGoals !== undefined) payload.career_goals = updatedGoals;

      const { error } = await supabase
        .from('student_profiles')
        .update(payload)
        .eq('id', profileId);

      if (error) throw error;
      setFeedback({ type: 'success', message: 'Profile updated successfully!' });
    } catch (err: any) {
      console.error('Error saving profile data:', err);
      setFeedback({ type: 'error', message: err.message || 'Failed to save changes.' });
    } finally {
      setSaving(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  // Helper function to compress image files before storing as base64 in jsonb
  const compressImage = (file: File, maxDim: number, callback: (base64: string) => void) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
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
          // Convert to compressed jpeg format (80% quality)
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          callback(dataUrl);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Club Operations
  const openAddClubModal = () => {
    setEditingClubIndex(null);
    setClubName('');
    setClubRole('');
    setClubJoined('');
    setClubLogo('');
    setClubModalOpen(true);
  };

  const openEditClubModal = (index: number) => {
    const currentClubs = clubs.length > 0 ? clubs : DEFAULT_CLUBS;
    const club = currentClubs[index];
    setEditingClubIndex(index);
    setClubName(club.name || '');
    setClubRole(club.role || '');
    setClubJoined(club.joined || '');
    setClubLogo(club.logo || '');
    setClubModalOpen(true);
  };

  const handleClubSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clubName.trim()) return;

    const newClub = {
      name: clubName.trim(),
      role: clubRole.trim() || 'Member',
      joined: clubJoined.trim() || new Date().getFullYear().toString(),
      logo: clubLogo,
    };

    const currentClubs = clubs.length > 0 ? clubs : DEFAULT_CLUBS;
    let updatedClubs = [...currentClubs];
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

    const currentClubs = clubs.length > 0 ? clubs : DEFAULT_CLUBS;
    const updatedClubs = currentClubs.filter((_, i) => i !== index);
    setClubs(updatedClubs);
    await saveToDatabase(updatedClubs, certifications);
  };

  // Certification Operations
  const openAddCertModal = () => {
    setEditingCertIndex(null);
    setCertName('');
    setCertLink('');
    setCertImage('');
    setCertModalOpen(true);
  };

  const openEditCertModal = (index: number) => {
    const currentCerts = certifications.length > 0 ? certifications : DEFAULT_CERTS;
    const cert = currentCerts[index];
    setEditingCertIndex(index);
    setCertName(cert.name || '');
    setCertLink(cert.link || '');
    setCertImage(cert.image || '');
    setCertModalOpen(true);
  };

  const handleCertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certName.trim()) return;

    const newCert = {
      name: certName.trim(),
      link: certLink.trim(),
      image: certImage,
    };

    const currentCerts = certifications.length > 0 ? certifications : DEFAULT_CERTS;
    let updatedCerts = [...currentCerts];
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

    const currentCerts = certifications.length > 0 ? certifications : DEFAULT_CERTS;
    const updatedCerts = currentCerts.filter((_, i) => i !== index);
    setCertifications(updatedCerts);
    await saveToDatabase(clubs, updatedCerts);
  };

  // Aspirations Operations
  const openEditAspirationsModal = () => {
    setFormInterests(interests || DEFAULT_INTERESTS);
    setFormDreams(dreams || DEFAULT_DREAMS);
    setFormCareerGoals(careerGoals || DEFAULT_CAREER_GOALS);
    setAspirationModalOpen(true);
  };

  const handleAspirationsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInterests(formInterests);
    setDreams(formDreams);
    setCareerGoals(formCareerGoals);
    setAspirationModalOpen(false);
    await saveToDatabase(clubs, certifications, formInterests, formDreams, formCareerGoals);
  };

  // Skills Operations
  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSkill = newSkillText.trim();
    if (!cleanSkill) return;

    const currentSkills = skills.length > 0 ? skills : DEFAULT_SKILLS;
    if (currentSkills.includes(cleanSkill)) {
      alert('Skill already exists.');
      return;
    }

    const updatedSkills = [...currentSkills, cleanSkill];
    setSkills(updatedSkills);
    setNewSkillText('');
    await saveToDatabase(clubs, certifications, interests, dreams, careerGoals, updatedSkills);
  };

  const handleRemoveSkill = async (skillToRemove: string) => {
    const currentSkills = skills.length > 0 ? skills : DEFAULT_SKILLS;
    const updatedSkills = currentSkills.filter(s => s !== skillToRemove);
    setSkills(updatedSkills);
    await saveToDatabase(clubs, certifications, interests, dreams, careerGoals, updatedSkills);
  };

  return (
    <ProtectedRoute role="student">
      <PageShell title="Extracurricular Activities" subtitle="Clubs, certifications, and career aspirations">
        <div className="grid gap-6 p-4 md:p-6 lg:grid-cols-[260px_minmax(0,1fr)] w-full min-w-0">
          <Sidebar active="/student/extracurricular" items={[{ href: '/student', label: 'Profile' }, { href: '/student/academic', label: 'Academic Profile' }, { href: '/student/extracurricular', label: 'Extracurricular Activities' }, { href: '/student/performance', label: 'Performance' }, { href: '/student/queries', label: 'Problems / Queries' }]} />
          
          <div className="grid gap-6 w-full min-w-0">
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
              ) : (
                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  {(clubs.length > 0 ? clubs : DEFAULT_CLUBS).map((club, index) => (
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

                      <div className="flex items-center gap-3 mb-2">
                        <div className="h-12 w-12 rounded-2xl bg-white border border-slate-100 overflow-hidden flex items-center justify-center shrink-0 shadow-sm">
                          {club.logo ? (
                            <img src={club.logo} alt={club.name} className="h-full w-full object-cover" />
                          ) : (
                            <Users className="h-5 w-5 text-emerald-800" />
                          )}
                        </div>
                        <div>
                          <div className="text-lg font-bold text-portal-ink leading-tight">{club.name}</div>
                          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">{club.role}</div>
                        </div>
                      </div>

                      <div className="mt-4 text-xs font-semibold text-slate-500">Joined Year: <span className="text-slate-700">{club.joined}</span></div>
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
              ) : (
                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  {(certifications.length > 0 ? certifications : DEFAULT_CERTS).map((item, index) => (
                    <div key={index} className="group relative rounded-3xl border border-portal-line bg-white p-5 transition duration-300 hover:-translate-y-0.5 hover:shadow-soft flex flex-col justify-between min-h-[140px]">
                      {/* Action buttons (hover overlay) */}
                      <div className="absolute right-3 top-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
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

                      <div>
                        <div className="font-bold text-portal-ink text-base max-w-[80%] leading-snug">{item.name}</div>
                        
                        {item.image && (
                          <div 
                            onClick={() => setSelectedCertImage(item.image)}
                            className="mt-3 relative aspect-video w-full overflow-hidden rounded-xl border border-slate-200 cursor-pointer group/thumb hover:brightness-95 transition"
                            title="Click to view full certificate"
                          >
                            <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                            <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover/thumb:opacity-100 transition flex items-center justify-center text-white text-xs font-semibold gap-1">
                              <ImageIcon className="h-3.5 w-3.5" />
                              <span>View Full Size</span>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-4">
                        {item.link ? (
                          <a 
                            href={item.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 hover:text-sky-700 hover:underline"
                          >
                            <span>Verify credential link</span>
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

            {/* Aspirations, Dreams & Interests */}
            <div className="portal-card relative overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-portal-line pb-4 mb-5">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-6 w-6 text-amber-500" />
                  <h2 className="text-2xl font-semibold">Personal Goals & Interests</h2>
                </div>
                <button
                  onClick={openEditAspirationsModal}
                  disabled={loading}
                  className="rounded-2xl bg-[#1c5644] hover:bg-[#154335] px-4 py-2.5 text-xs font-semibold text-white transition flex items-center gap-1.5 shadow-sm"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  <span>Edit Goals</span>
                </button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-6 text-slate-500">
                  <Loader2 className="h-5 w-5 animate-spin text-[#1c5644] mr-2" />
                  <span>Loading goals...</span>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-3">
                  {/* Interests Column */}
                  <div className="rounded-3xl border border-white/80 bg-[linear-gradient(180deg,#f0f6f3,#e4f0eb)] p-5 shadow-sm">
                    <div className="flex items-center gap-2 text-emerald-800 mb-3">
                      <Heart className="h-5 w-5 fill-emerald-800/10" />
                      <h3 className="font-bold text-base">My Core Interests</h3>
                    </div>
                    <p className="text-xs text-slate-700 font-medium whitespace-pre-wrap leading-relaxed">
                      {interests.trim() || DEFAULT_INTERESTS}
                    </p>
                  </div>

                  {/* Dreams Column */}
                  <div className="rounded-3xl border border-white/80 bg-[linear-gradient(180deg,#f1f9ff,#e1f0ff)] p-5 shadow-sm">
                    <div className="flex items-center gap-2 text-sky-800 mb-3">
                      <Sparkles className="h-5 w-5 text-sky-800" />
                      <h3 className="font-bold text-base">My Biggest Dream</h3>
                    </div>
                    <p className="text-xs text-slate-700 font-medium whitespace-pre-wrap leading-relaxed">
                      {dreams.trim() || DEFAULT_DREAMS}
                    </p>
                  </div>

                  {/* Career Goals Column */}
                  <div className="rounded-3xl border border-white/80 bg-[linear-gradient(180deg,#fffaf2,#faeed9)] p-5 shadow-sm">
                    <div className="flex items-center gap-2 text-amber-800 mb-3">
                      <Target className="h-5 w-5 text-amber-800" />
                      <h3 className="font-bold text-base">Who I Want to Become</h3>
                    </div>
                    <p className="text-xs text-slate-700 font-medium whitespace-pre-wrap leading-relaxed">
                      {careerGoals.trim() || DEFAULT_CAREER_GOALS}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Skills & Expertise */}
            <div className="portal-card relative overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-portal-line pb-4 mb-5">
                <div className="flex items-center gap-2">
                  <Target className="h-6 w-6 text-emerald-850" />
                  <h2 className="text-2xl font-semibold">Skills & Expertise</h2>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-6 text-slate-500">
                  <Loader2 className="h-5 w-5 animate-spin text-[#1c5644] mr-2" />
                  <span>Loading skills...</span>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Skill tags container */}
                  <div className="flex flex-wrap gap-2.5">
                    {skills.map((skill, index) => (
                      <span 
                        key={index}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-[#1c5644]/10 text-emerald-850 border border-[#1c5644]/20 group/tag hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition duration-200 cursor-pointer"
                        onClick={() => handleRemoveSkill(skill)}
                        title="Click to remove skill"
                      >
                        <span>{skill}</span>
                        <X className="h-3 w-3 text-slate-400 group-hover/tag:text-rose-500 transition" />
                      </span>
                    ))}
                  </div>

                  {/* Add skill input */}
                  <form onSubmit={handleAddSkill} className="flex max-w-md items-center gap-2">
                    <input 
                      type="text" 
                      placeholder="Add a new skill (e.g. Python, React)"
                      value={newSkillText}
                      onChange={(e) => setNewSkillText(e.target.value)}
                      className="flex-1 min-w-0 rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-semibold focus:border-[#1c5644] focus:bg-white focus:outline-none transition"
                    />
                    <button 
                      type="submit"
                      disabled={saving}
                      className="rounded-xl bg-[#1c5644] hover:bg-[#154335] px-4 py-2 text-xs font-bold text-white transition flex items-center gap-1 shadow-sm"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add</span>
                    </button>
                  </form>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Full Screen Lightbox Preview for Certificates */}
        {selectedCertImage && (
          <div 
            onClick={() => setSelectedCertImage(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-fadeIn"
          >
            <div 
              onClick={(e) => e.stopPropagation()} 
              className="relative max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl bg-white p-2 border border-white/10 shadow-2xl flex flex-col items-center animate-in zoom-in-95 duration-200"
            >
              <button 
                onClick={() => setSelectedCertImage(null)}
                className="absolute right-4 top-4 rounded-full p-2 bg-slate-900/80 text-white hover:bg-slate-800 transition"
              >
                <X className="h-5 w-5" />
              </button>
              <img src={selectedCertImage} alt="Certificate Document" className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-sm" />
            </div>
          </div>
        )}

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
                {editingClubIndex !== null ? 'Edit Club Details' : 'Add Club & Organization'}
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

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Club Logo / Logo Image</label>
                  <div className="mt-1 flex items-center gap-3">
                    {clubLogo && (
                      <div className="h-12 w-12 rounded-xl overflow-hidden border border-slate-200 shrink-0">
                        <img src={clubLogo} alt="Logo preview" className="h-full w-full object-cover" />
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) compressImage(file, 200, setClubLogo);
                      }}
                      className="block w-full text-xs text-slate-500
                        file:mr-3 file:py-2 file:px-3
                        file:rounded-xl file:border-0
                        file:text-xs file:font-semibold
                        file:bg-emerald-50 file:text-emerald-700
                        hover:file:bg-emerald-100 transition"
                    />
                  </div>
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
                {editingCertIndex !== null ? 'Edit Certification Details' : 'Add Certification & Achievement'}
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

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Certificate Image / Photo</label>
                  <div className="mt-1 flex items-center gap-3">
                    {certImage && (
                      <div className="h-12 w-12 rounded-xl overflow-hidden border border-slate-200 shrink-0">
                        <img src={certImage} alt="Certificate preview" className="h-full w-full object-cover" />
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) compressImage(file, 600, setCertImage);
                      }}
                      className="block w-full text-xs text-slate-500
                        file:mr-3 file:py-2 file:px-3
                        file:rounded-xl file:border-0
                        file:text-xs file:font-semibold
                        file:bg-emerald-50 file:text-emerald-700
                        hover:file:bg-emerald-100 transition"
                    />
                  </div>
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

        {/* Aspirations Modal */}
        {aspirationModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fadeIn">
            <div className="relative w-full max-w-lg overflow-hidden rounded-[28px] bg-white p-6 shadow-xl border border-slate-100 animate-in zoom-in-95 duration-200">
              <button 
                onClick={() => setAspirationModalOpen(false)}
                className="absolute right-4 top-4 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X className="h-5 w-5" />
              </button>

              <h3 className="text-xl font-bold text-slate-900">Edit Goals & Aspirations</h3>
              
              <form onSubmit={handleAspirationsSubmit} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">My Core Interests</label>
                  <textarea
                    value={formInterests}
                    onChange={(e) => setFormInterests(e.target.value)}
                    placeholder="e.g. Artificial Intelligence, Full-stack web development, Robotics, Music production"
                    rows={3}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-xs focus:border-emerald-600 focus:bg-white focus:outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">My Biggest Dream</label>
                  <textarea
                    value={formDreams}
                    onChange={(e) => setFormDreams(e.target.value)}
                    placeholder="e.g. Build an open-source AI platform, work at a global research lab, or launch a tech startup that changes lives."
                    rows={3}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-xs focus:border-emerald-600 focus:bg-white focus:outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Who I Want to Become</label>
                  <textarea
                    value={formCareerGoals}
                    onChange={(e) => setFormCareerGoals(e.target.value)}
                    placeholder="e.g. Lead Software Architect or Senior AI Researcher who drives cutting-edge technology innovations."
                    rows={3}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-xs focus:border-emerald-600 focus:bg-white focus:outline-none resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setAspirationModalOpen(false)}
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
                    <span>Save Goals</span>
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