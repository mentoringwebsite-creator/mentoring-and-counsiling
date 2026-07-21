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

export async function POST(request: NextRequest) {
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json(
      { success: false, message: 'Missing server-side Supabase credentials.' },
      { status: 500 }
    );
  }

  const body = await request.json();
  const { mentorId, branch } = body ?? {};

  let mName = 'Not Assigned';
  let hName = 'Not Assigned';

  if (mentorId) {
    const { data: mentorUser } = await supabase
      .from('users')
      .select('name')
      .eq('id', mentorId)
      .single();
      
    if (mentorUser) {
      mName = mentorUser.name;
      const { data: facProfile } = await supabase
        .from('faculty_profiles')
        .select('hod_id')
        .eq('user_id', mentorId)
        .single();
        
      if (facProfile?.hod_id) {
        const { data: hodUser } = await supabase.from('users').select('name').eq('id', facProfile.hod_id).single();
        if (hodUser) hName = hodUser.name;
      }
    }
  }

  if (hName === 'Not Assigned' && branch) {
    const { data: hods } = await supabase.from('users').select('name, hod_profiles(department)').eq('role', 'hod');
    const matchedHod = (hods || []).find((h: any) => {
      const d = h.hod_profiles?.[0]?.department;
      if (!d) return false;
      
      const b = branch.toLowerCase().trim();
      const dep = d.toLowerCase().trim();
      if (b === dep) return true;
      if (b === 'ece' && (dep.includes('electronics') || dep.includes('ece'))) return true;
      if (b === 'cse' && (dep.includes('computer') || dep.includes('cse'))) return true;
      if (b === 'it' && dep.includes('information')) return true;
      if (b === 'mech' || b === 'mechanical') {
        if (dep.includes('mech')) return true;
      }
      if (b === 'civil' && dep.includes('civil')) return true;
      if (b === 'eee' && (dep.includes('electrical') || dep.includes('eee'))) return true;
      if (b.includes('ai') || b.includes('ml') || b.includes('data')) {
        if (dep.includes('ai') || dep.includes('ml') || dep.includes('cse') || dep.includes('computer')) return true;
      }
      return false;
    });
    if (matchedHod) hName = matchedHod.name;
  }

  return NextResponse.json({ success: true, mName, hName });
}
