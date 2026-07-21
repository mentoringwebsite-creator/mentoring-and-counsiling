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
  const b = branch.toLowerCase().trim();
  const d = department.toLowerCase().trim();
  
  if (b === d) return true;
  if (b === 'ece' && (d.includes('electronics') || d.includes('ece'))) return true;
  if (d.includes('electronics') && b.includes('ece')) return true;
  if (b === 'cse' && (d.includes('computer science') || d.includes('cse'))) return true;
  if (d.includes('computer science') && b.includes('cse')) return true;
  if (b === 'it' && (d.includes('information technology') || d.includes('it'))) return true;
  if (d.includes('information technology') && b.includes('it')) return true;
  if (b === 'eee' && (d.includes('electrical') || d.includes('eee'))) return true;
  if (d.includes('electrical') && b.includes('eee')) return true;
  if ((b === 'me' || b === 'mech' || b.includes('mechanical')) && (d.includes('mechanical') || d.includes('mech') || d === 'me')) return true;
  if ((b === 'ce' || b.includes('civil')) && (d.includes('civil') || d === 'ce')) return true;
  return d.includes(b) || b.includes(d);
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
        const fp = f.faculty_profiles?.[0];
        if (fp?.hod_id === hodId) return true;
        const fDept = fp?.department;
        if (!dept || !fDept) return true;
        return isBranchInDepartment(fDept, dept);
      });
      const facultyIds = deptFaculty.map(f => f.id);

      const { data: queriesData } = await supabase
        .from('queries')
        .select(`
          id, type, subject, description, status, created_at, student_id,
          student:student_id (
            name, email,
            student_profiles (branch, mentor_id)
          )
        `)
        .order('created_at', { ascending: false });

      const filteredQueries = (queriesData || []).filter((q: any) => {
        const { raisedTo } = parseQueryMetadata(q.description);
        if (raisedTo !== 'HOD') return false;

        const studentProfile = q.student?.student_profiles?.[0];
        const studentBranch = studentProfile?.branch || '';
        const mentorId = studentProfile?.mentor_id;

        const branchMatches = studentBranch && dept && isBranchInDepartment(studentBranch, dept);
        const mentorInDept = mentorId && facultyIds.includes(mentorId);

        if (!dept) return true;
        return branchMatches || mentorInDept;
      });

      return NextResponse.json({ success: true, queries: filteredQueries });
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
