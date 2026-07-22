import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false }
  });
}

const parseQueryMetadata = (description: string) => {
  let raisedBy = 'Student';
  let raisedTo = 'Faculty';
  let cleanDesc = description || '';

  if (cleanDesc.includes('Raised By:')) {
    const byMatch = cleanDesc.match(/Raised By:\s*([^\n]*)/);
    if (byMatch) raisedBy = byMatch[1].trim();
    
    const toMatch = cleanDesc.match(/Raised To:\s*([^\n]*)/);
    if (toMatch) raisedTo = toMatch[1].trim();
    
    cleanDesc = cleanDesc.replace(/Raised By:.*\nRaised To:.*\n\n?/, '').trim();
  }
  return { raisedBy, raisedTo, cleanDesc };
};

const isBranchInDepartment = (branch: string, department: string) => {
  if (!branch || !department) return false;
  
  const b = branch.toLowerCase().replace(/[^a-z0-9]/g, '');
  const d = department.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  if (b === d || d.includes(b) || b.includes(d)) return true;
  
  const bWords = branch.toLowerCase();
  const dWords = department.toLowerCase();
  
  if (bWords.includes('ece') && (dWords.includes('electronic') || dWords.includes('ece'))) return true;
  if (dWords.includes('electronic') && bWords.includes('ece')) return true;
  if (bWords.includes('cse') && (dWords.includes('computer') || dWords.includes('cse'))) return true;
  if (dWords.includes('computer') && bWords.includes('cse')) return true;
  if (bWords.includes('it') && (dWords.includes('information') || dWords.includes('it'))) return true;
  if (dWords.includes('information') && bWords.includes('it')) return true;
  if (bWords.includes('eee') && (dWords.includes('electrical') || dWords.includes('eee'))) return true;
  if (dWords.includes('electrical') && bWords.includes('eee')) return true;
  if ((bWords.includes('me') || bWords.includes('mech')) && (dWords.includes('mechanic') || dWords.includes('mech') || dWords === 'me')) return true;
  if (bWords.includes('ce') && dWords.includes('civil')) return true;
  if (dWords.includes('civil') && bWords.includes('ce')) return true;

  const bTokens = bWords.split(/\s+/).filter(t => t.length > 2);
  const dTokens = dWords.split(/\s+/).filter(t => t.length > 2);
  for (const bt of bTokens) {
    if (dTokens.includes(bt)) return true;
  }

  return false;
};

export async function POST(request: NextRequest) {
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ success: false, message: 'Missing credentials' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'fetchQueries') {
      const { hodId } = body;
      if (!hodId) return NextResponse.json({ success: false, queries: [] });

      const { data: hodProfile } = await supabase
        .from('hod_profiles')
        .select('department')
        .eq('user_id', hodId)
        .single();
        
      const dept = hodProfile?.department || '';

      const { data: facultyUsers } = await supabase
        .from('users')
        .select(`id, faculty_profiles(department, hod_id)`)
        .eq('role', 'faculty');
      
      const deptFaculty = (facultyUsers || []).filter((f: any) => {
        const fp = Array.isArray(f.faculty_profiles) ? f.faculty_profiles[0] : f.faculty_profiles;
        if (fp?.hod_id === hodId) return true;
        const fDept = fp?.department;
        if (!dept || !fDept) return true;
        return isBranchInDepartment(fDept, dept);
      });
      const facultyIds = deptFaculty.map((f: any) => f.id);

      const { data: queriesData, error: queriesError } = await supabase
        .from('queries')
        .select('*')
        .order('created_at', { ascending: false });

      if (queriesError) throw queriesError;

      // Manually fetch student details for these queries to avoid PostgREST relationship ambiguity errors
      const studentIds = Array.from(new Set((queriesData || []).map(q => q.student_id).filter(Boolean)));
      
      let studentDetails: any[] = [];
      if (studentIds.length > 0) {
        const { data: usersData } = await supabase
          .from('users')
          .select('id, name, email, student_profiles(branch, mentor_id)')
          .in('id', studentIds);
        studentDetails = usersData || [];
      }

      const filteredQueries = (queriesData || []).filter((q: any) => {
        const { raisedTo } = parseQueryMetadata(q.description);
        const queryRaisedTo = q.raised_to_role || raisedTo;

        if (queryRaisedTo !== 'HOD') return false;
        if (q.target_hod_id) return q.target_hod_id === hodId;

        return true;
      });

      const formattedQueries = filteredQueries.map((q: any) => {
        const studentData = studentDetails.find(s => s.id === q.student_id);
        return {
          ...q,
          student: studentData || null
        };
      });

      return NextResponse.json({ success: true, queries: formattedQueries });
    }

    if (action === 'updateStatus') {
      const { queryId, status } = body;
      const { error } = await supabase.from('queries').update({ status }).eq('id', queryId);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (action === 'fetchMessages') {
      const { queryId } = body;
      const { data, error } = await supabase
        .from('query_messages')
        .select(`
          id, query_id, sender_id, message, created_at,
          users:sender_id (name, role)
        `)
        .eq('query_id', queryId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return NextResponse.json({ success: true, messages: data || [] });
    }

    if (action === 'sendMessage') {
      const { queryId, senderId, message } = body;
      const { error } = await supabase
        .from('query_messages')
        .insert([{ query_id: queryId, sender_id: senderId, message }]);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, message: 'Invalid action' });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
