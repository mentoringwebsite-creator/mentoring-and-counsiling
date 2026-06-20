'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, X, User, Mail, Phone, GraduationCap, BookOpen, AlertTriangle, Building, Briefcase } from 'lucide-react';

interface FacultyDetailsModalProps {
  facultyUserId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function FacultyDetailsModal({ facultyUserId, isOpen, onClose }: FacultyDetailsModalProps) {
  const [loading, setLoading] = useState(false);
  const [faculty, setFaculty] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !facultyUserId) {
      setFaculty(null);
      setError(null);
      return;
    }

    const fetchFacultyDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: dbError } = await supabase
          .from('users')
          .select(`
            id, name, email,
            faculty_profiles!user_id (
              faculty_id, designation, qualification, department, subjects, contact_number, profile_photo
            )
          `)
          .eq('id', facultyUserId)
          .single();

        if (dbError) throw dbError;
        setFaculty(data);
      } catch (err: any) {
        console.error('Error fetching faculty details:', err);
        setError(err.message || 'Failed to load faculty details.');
      } finally {
        setLoading(false);
      }
    };

    fetchFacultyDetails();
  }, [facultyUserId, isOpen]);

  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  if (!isOpen) return null;

  const profile = faculty?.faculty_profiles?.[0] || {};
  const subjectsArray = profile.subjects 
    ? profile.subjects.split(',').map((s: string) => s.trim()).filter(Boolean) 
    : [];

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-md animate-fade-in"
    >
      <div 
        onClick={handleContentClick}
        className="relative flex w-full max-w-xl flex-col overflow-hidden rounded-[32px] border border-white/60 bg-white/80 backdrop-blur-xl shadow-2xl transition duration-300 animate-scale-in"
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute right-6 top-6 z-20 rounded-full p-2 text-slate-400 bg-white/80 border border-slate-100 hover:bg-slate-100 hover:text-slate-700 transition"
        >
          <X className="h-5 w-5" />
        </button>

        {loading ? (
          <div className="flex flex-col items-center justify-center text-slate-500 py-16">
            <Loader2 className="h-9 w-9 animate-spin text-[#1c5644] mb-3" />
            <p className="font-semibold text-xs">Loading faculty profile...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center text-rose-800 p-8 text-center">
            <AlertTriangle className="h-10 w-10 text-rose-500 mb-2" />
            <p className="font-bold text-base">Error Loading Faculty Profile</p>
            <p className="text-xs mt-1 text-rose-600 max-w-sm">{error}</p>
            <button 
              onClick={onClose}
              className="mt-4 rounded-xl bg-slate-800 text-white px-4 py-2 text-xs font-semibold hover:bg-slate-700 transition"
            >
              Close
            </button>
          </div>
        ) : !faculty ? (
          <div className="flex flex-col items-center justify-center text-slate-500 py-16">
            <User className="h-9 w-9 text-slate-300 mb-2" />
            <p className="font-semibold text-xs">No faculty member selected</p>
          </div>
        ) : (
          <div className="p-6 md:p-8">
            <div className="flex flex-col items-center text-center pb-6 border-b border-slate-200/50">
              {/* Photo */}
              <div className="h-24 w-24 rounded-[28px] border-4 border-white bg-white shadow-md overflow-hidden flex items-center justify-center shrink-0 mb-4">
                {profile.profile_photo ? (
                  <img src={profile.profile_photo} alt={faculty.name} className="h-full w-full object-cover" />
                ) : (
                  <GraduationCap className="h-12 w-12 text-emerald-800" />
                )}
              </div>

              {/* Identity */}
              <h2 className="text-2xl font-black text-slate-900 leading-tight">{faculty.name}</h2>
              <p className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 mt-2">
                {profile.designation || 'Faculty Mentor'}
              </p>
              <p className="text-xs text-slate-500 font-bold font-mono mt-1.5">ID: {profile.faculty_id || 'N/A'}</p>
            </div>

            {/* details body */}
            <div className="mt-6 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50/60 p-4 border border-slate-100 flex gap-3 items-start">
                  <Building className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Department</div>
                    <div className="text-xs font-bold text-slate-800 mt-0.5">{profile.department || 'Not Specified'}</div>
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50/60 p-4 border border-slate-100 flex gap-3 items-start">
                  <Briefcase className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Qualification</div>
                    <div className="text-xs font-bold text-slate-800 mt-0.5">{profile.qualification || 'Not Specified'}</div>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="rounded-2xl border border-slate-150 p-4 space-y-3 bg-white">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                  <div className="text-xs">
                    <span className="text-slate-400 font-semibold mr-1.5">Email:</span>
                    <a href={`mailto:${faculty.email}`} className="font-bold text-slate-800 hover:text-emerald-800 break-all">{faculty.email}</a>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                  <div className="text-xs">
                    <span className="text-slate-400 font-semibold mr-1.5">Contact:</span>
                    <span className="font-mono font-bold text-slate-800">{profile.contact_number || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Subjects Taught */}
              <div className="rounded-2xl border border-slate-150 p-4 bg-white">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4 text-emerald-800" />
                  <span>Subjects Taught</span>
                </h3>
                {subjectsArray.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No subjects registered yet.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {subjectsArray.map((sub: string, index: number) => (
                      <span key={index} className="rounded-lg bg-emerald-50 px-2 py-1 text-[10px] font-bold text-[#1c5644] border border-emerald-100/50">
                        {sub}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
